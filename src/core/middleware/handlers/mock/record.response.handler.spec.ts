import 'reflect-metadata';
import {Container} from 'inversify';
import * as fs from 'fs-extra';
import * as http from 'http';
import * as os from 'os';
import * as path from 'path';
import {
    assert,
    createStubInstance,
    match,
    SinonFakeTimers,
    SinonStub,
    SinonStubbedInstance,
    stub,
    useFakeTimers
} from 'sinon';
import * as uuid from 'uuid';

import {RecordResponseHandler} from './record.response.handler';
import {State} from '../../../state/state';
import {Mock} from '../../../mock/mock';
import {HttpMethods, HttpStatusCode} from '../../http';
import {Recording} from '../../../state/recording';
import {IState} from '../../../state/Istate';

describe('RecordResponseHandler', () => {
    let clock: SinonFakeTimers;
    let container: Container;
    let fetchResponseFn: SinonStub;
    let fsWriteFileSyncFn: SinonStub;
    let state: SinonStubbedInstance<State>;
    let nextFn: SinonStub;
    let matchingState: IState;
    let mock: Mock;
    let now: Date;
    let recordFn: SinonStub;
    let recordResponseHandler: RecordResponseHandler;
    let request: any;
    let responseBufferFn: SinonStub;
    let responseHeadersGetFn: SinonStub;
    let responseHeadersRawFn: SinonStub;
    let response: SinonStubbedInstance<http.ServerResponse>;
    let uuidV4Fn: SinonStub;


    beforeAll(() => {
        container = new Container();
        state = createStubInstance(State);
        mock = { name: 'some' } as Mock;
        nextFn = stub();
        now = new Date();
        clock = useFakeTimers(now.getTime());
        request = createStubInstance(http.IncomingMessage);
        request.url = '/some/api';
        request.method = HttpMethods.GET;
        request.headers = { host: 'localhost:8888' };
        responseBufferFn = stub();
        responseHeadersRawFn = stub();
        responseHeadersGetFn = stub();
        response = createStubInstance(http.ServerResponse);
        uuidV4Fn = stub(uuid, 'v4');
        fsWriteFileSyncFn = stub(fs, 'writeFileSync');

        container.bind('BaseUrl').toConstantValue('baseUrl');
        container.bind('State').toConstantValue(state);
        container.bind('RecordResponseHandler').to(RecordResponseHandler);

        recordResponseHandler = container.get<RecordResponseHandler>('RecordResponseHandler');

        recordFn = stub(RecordResponseHandler.prototype, 'record');
        fetchResponseFn = stub(RecordResponseHandler.prototype, 'fetchResponse');
    });

    describe('handle', () => {
        beforeEach(() => {
            responseBufferFn.returns('the-data');
            responseHeadersRawFn.returns({ 'Content-Type': 'application/pdf' });
        });

        describe('by default', () => {
            beforeEach(() => {
                fetchResponseFn.resolves({
                    buffer: responseBufferFn, headers: { raw: responseHeadersRawFn }, status: 200
                });
                recordResponseHandler.handle(request, response, nextFn, {
                    id: 'apimockId',
                    mock: mock,
                    body: `{'x':'x'}`
                });
            });

            it('sets the record header to true', () =>
                expect(request.headers.record).toBe('true'));

            it('calls the api', () => {
                assert.calledWith(fetchResponseFn, match(async (actual: Request) => {
                    await expect(actual.url).toBe('http://localhost:8888/some/api');
                    await expect(actual.method).toBe(HttpMethods.GET);
                    await expect(actual.headers.get('host')).toBe('localhost:8888');
                    return await expect(actual.headers.get('record')).toBe('true');
                }));
            });

            afterEach(() => {
                fetchResponseFn.reset();
                recordFn.reset();
            });
        });

        describe('on successful api call', () => {
            beforeEach(() => {
                responseHeadersGetFn.returns('application/pdf');
                fetchResponseFn.resolves({
                    buffer: responseBufferFn,
                    headers: { raw: responseHeadersRawFn, get: responseHeadersGetFn },
                    status: 200
                });
            });

            it('on request data record', async () => {
                await recordResponseHandler.handle(request, response, nextFn, {
                    id: 'apimockId',
                    mock: mock,
                    body: `{'x':'x'}`
                });
                assert.calledWith(recordFn, 'apimockId', 'some', match(async (actual: Recording) => {
                    await expect(actual.request.url).toBe('/some/api');
                    await expect(actual.request.method).toBe(HttpMethods.GET);
                    await expect(actual.request.headers).toEqual({ host: 'localhost:8888', record: 'true' });
                    await expect(actual.request.body).toBe(JSON.stringify({ x: 'x' }) as any);

                    await expect(actual.response.data).toBe('the-data');
                    await expect(actual.response.status).toBe(HttpStatusCode.OK);
                    await expect(actual.response.headers).toEqual({ 'Content-Type': 'application/pdf' });
                    return true;
                }));
            });

            it('returns the response', async () => {
                await recordResponseHandler.handle(request, response, nextFn, {
                    id: 'apimockId',
                    mock: mock,
                    body: `{'x':'x'}`
                });
                assert.calledWith(response.writeHead, HttpStatusCode.OK, { 'Content-Type': 'application/pdf' });
                assert.calledWith(response.end, 'the-data');
            });

            afterEach(() => {
                fetchResponseFn.reset();
                recordFn.reset();
                response.end.reset();
                response.writeHead.reset();
            });
        });

        describe('on unsuccessful api call', () => {
            let rejectedPromise: Promise<any>;
            beforeEach(() => {
                rejectedPromise = Promise.reject({ message: 'oops' });
                fetchResponseFn.resolves(rejectedPromise);
            });

            it('returns the error response', async () => {
                try {
                    await recordResponseHandler.handle(request, response, nextFn, {
                        id: 'apimockId',
                        mock: mock,
                        body: `{'x':'x'}`
                    });
                    await rejectedPromise;
                } catch (err) {
                    assert.calledWith(response.end, 'oops');
                }
            });

            afterEach(() => {
                fetchResponseFn.reset();
                recordFn.reset();
                response.end.reset();
                response.writeHead.reset();
            });
        });
    });

    describe('record', () => {
        let recording: Recording;

        beforeEach(() => {
            matchingState = {
                mocks: {},
                variables: {},
                recordings: {},
                record: false
            };
            state.getMatchingState.returns(matchingState);

            recording = {
                request: {
                    url: '/some/url',
                    method: HttpMethods.GET,
                    headers: { host: 'localhost:8888' },
                    body: { 'some-key': 'some-value' }
                },
                response: {
                    data: 'the-data',
                    status: HttpStatusCode.OK,
                    headers: { 'Content-Type': '...' },
                    contentType: '...'
                },
                datetime: new Date().getTime()
            };

            recordFn.callThrough();
            uuidV4Fn.returns('generated-uuid');
        });

        describe('applicable mimetype', () => {
            it('stores the recording', () => {
                recording.response.contentType = 'application/json';
                recordFn.callThrough();
                recordResponseHandler.record('apimockId', 'identifier', recording);
                const actual = matchingState.recordings['identifier'][0];
                expect(actual.request.url).toBe('/some/url');
                expect(actual.request.method).toBe(HttpMethods.GET);
                expect(actual.request.headers).toEqual({ host: 'localhost:8888' });
                expect(actual.request.body).toEqual({ 'some-key': 'some-value' });
                expect(actual.response.data).toBe('the-data');
                expect(actual.response.status).toEqual(HttpStatusCode.OK);
                expect(actual.response.headers).toEqual({ 'Content-Type': '...' });
            });
        });

        describe('non applicable mimetype', () => {
            it('stores the recording', () => {
                recording.response.contentType = 'application/pdf';
                recordFn.callThrough();
                recordResponseHandler.record('apimockId', 'identifier', recording);
                const actual = matchingState.recordings['identifier'][0];
                expect(actual.request.url).toBe('/some/url');
                expect(actual.request.method).toBe(HttpMethods.GET);
                expect(actual.request.headers).toEqual({ host: 'localhost:8888' });
                expect(actual.request.body).toEqual({ 'some-key': 'some-value' });
                // updates the data
                expect(actual.response.data).toBe(`{'apimockFileLocation':'baseUrl/recordings/generated-uuid.pdf'}`);
                expect(actual.response.status).toEqual(HttpStatusCode.OK);
                expect(actual.response.headers).toEqual({ 'Content-Type': '...' });
            });

            it('saves the data', () => {
                assert.calledWith(fsWriteFileSyncFn, path.join(os.tmpdir(), 'generated-uuid.pdf'));
            });
        });
    });

    afterAll(() => {
        clock.restore();
        fsWriteFileSyncFn.restore();
        fetchResponseFn.restore();
        recordFn.restore();
        uuidV4Fn.restore();
    });
});
