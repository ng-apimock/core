import 'reflect-metadata';
import {Container} from 'inversify';
import * as fs from 'fs-extra';
import * as http from 'http';
import * as os from 'os';
import * as path from 'path';
import * as sinon from 'sinon';
import * as uuid from 'uuid';

import RecordResponseHandler from './record.response.handler';
import MocksState from '../../../state/mocks.state';
import Mock from '../../../mock/mock';
import {HttpMethods, HttpStatusCode} from '../../http';
import Recording from '../../../state/recording';

describe('RecordResponseHandler', () => {
    let clock: sinon.SinonFakeTimers;
    let container: Container;
    let fetchResponseFn: sinon.SinonStub;
    let fsWriteFileSyncFn: sinon.SinonStub;
    let mocksState: sinon.SinonStubbedInstance<MocksState>;
    let nextFn: sinon.SinonStub;
    let mock: Mock;
    let now: Date;
    let recordFn: sinon.SinonStub;
    let recordResponseHandler: RecordResponseHandler;
    let request: any;
    let responseBufferFn: sinon.SinonStub;
    let responseHeadersGetFn: sinon.SinonStub;
    let responseHeadersRawFn: sinon.SinonStub;
    let response: sinon.SinonStubbedInstance<http.ServerResponse>;
    let uuidV4Fn: sinon.SinonStub;


    beforeAll(() => {
        container = new Container();
        mocksState = sinon.createStubInstance(MocksState);
        mock = {name: 'some'} as Mock;
        nextFn = sinon.stub();
        now = new Date();
        clock = sinon.useFakeTimers(now.getTime());
        request = sinon.createStubInstance(http.IncomingMessage);
        request.url = '/some/api';
        request.method = HttpMethods.GET;
        request.headers = {host: 'localhost:8888'};
        responseBufferFn = sinon.stub();
        responseHeadersRawFn = sinon.stub();
        responseHeadersGetFn = sinon.stub();
        response = sinon.createStubInstance(http.ServerResponse);
        uuidV4Fn = sinon.stub(uuid, 'v4');
        fsWriteFileSyncFn = sinon.stub(fs, 'writeFileSync');

        container.bind('BaseUrl').toConstantValue('baseUrl');
        container.bind('MocksState').toConstantValue(mocksState);
        container.bind('RecordResponseHandler').to(RecordResponseHandler);

        recordResponseHandler = container.get<RecordResponseHandler>('RecordResponseHandler');

        recordFn = sinon.stub(RecordResponseHandler.prototype, 'record');
        fetchResponseFn = sinon.stub(RecordResponseHandler.prototype, 'fetchResponse');
    });

    describe('handle', () => {
        beforeEach(() => {
            responseBufferFn.returns('the-data');
            responseHeadersRawFn.returns({'Content-Type': 'application/pdf'});
        });

        describe('by default', () => {
            beforeEach(() => {
                fetchResponseFn.resolves({
                    buffer: responseBufferFn, headers: {raw: responseHeadersRawFn}, status: 200
                });
                recordResponseHandler.handle(request, response, nextFn, {mock: mock, body: '{"x":"x"}'});
            });

            it('sets the record header to true', () =>
                expect(request.headers.record).toBe('true'));

            it('calls the api', () => {
                sinon.assert.calledWith(fetchResponseFn, sinon.match(async (actual: Request) => {
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
                    buffer: responseBufferFn, headers: {raw: responseHeadersRawFn, get: responseHeadersGetFn}, status: 200
                });
            });

            it('on request data record', async () => {
                await recordResponseHandler.handle(request, response, nextFn, {mock: mock, body: '{"x":"x"}'});
                sinon.assert.calledWith(recordFn, 'some', sinon.match(async (actual: Recording) => {
                    await expect(actual.request.url).toBe('/some/api');
                    await expect(actual.request.method).toBe(HttpMethods.GET);
                    await expect(actual.request.headers).toEqual({host: 'localhost:8888', record: 'true'});
                    await expect(actual.request.body).toBe(JSON.stringify({x: 'x'}) as any);

                    await expect(actual.response.data).toBe('the-data');
                    await expect(actual.response.status).toBe(HttpStatusCode.OK);
                    await expect(actual.response.headers).toEqual({'Content-Type': 'application/pdf'});
                    return true;
                }));
            });

            it('returns the response', async () => {
                await recordResponseHandler.handle(request, response, nextFn, {mock: mock, body: '{"x":"x"}'});
                sinon.assert.calledWith(response.writeHead, HttpStatusCode.OK, {'Content-Type': 'application/pdf'});
                sinon.assert.calledWith(response.end, 'the-data');
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
                rejectedPromise = Promise.reject({message: 'oops'});
                fetchResponseFn.resolves(rejectedPromise);
            });

            it('returns the error response', async () => {
                try {
                    await recordResponseHandler.handle(request, response, nextFn, {mock: mock, body: '{"x":"x"}'});
                    await rejectedPromise;
                } catch (err) {
                    sinon.assert.calledWith(response.end, 'oops');
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
            mocksState.recordings = {};

            recording = {
                request: {
                    url: '/some/url',
                    method: HttpMethods.GET,
                    headers: {host: 'localhost:8888'},
                    body: {'some-key': 'some-value'}
                },
                response: {
                    data: 'the-data',
                    status: HttpStatusCode.OK,
                    headers: {'Content-Type': '...'},
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
                recordResponseHandler.record('identifier', recording);
                const actual = mocksState.recordings['identifier'][0];
                expect(actual.request.url).toBe('/some/url');
                expect(actual.request.method).toBe(HttpMethods.GET);
                expect(actual.request.headers).toEqual({host: 'localhost:8888'});
                expect(actual.request.body).toEqual({'some-key': 'some-value'});
                expect(actual.response.data).toBe('the-data');
                expect(actual.response.status).toEqual(HttpStatusCode.OK);
                expect(actual.response.headers).toEqual({'Content-Type': '...'});
            });
        });

        describe('non applicable mimetype', () => {
            it('stores the recording', () => {
                recording.response.contentType = 'application/pdf';
                recordFn.callThrough();
                recordResponseHandler.record('identifier', recording);
                const actual = mocksState.recordings['identifier'][0];
                expect(actual.request.url).toBe('/some/url');
                expect(actual.request.method).toBe(HttpMethods.GET);
                expect(actual.request.headers).toEqual({host: 'localhost:8888'});
                expect(actual.request.body).toEqual({'some-key': 'some-value'});
                // updates the data
                expect(actual.response.data).toBe('{"apimockFileLocation":"baseUrl/recordings/generated-uuid.pdf"}');
                expect(actual.response.status).toEqual(HttpStatusCode.OK);
                expect(actual.response.headers).toEqual({'Content-Type': '...'});
            });

            it('saves the data', () => {
                sinon.assert.calledWith(fsWriteFileSyncFn, path.join(os.tmpdir(), 'generated-uuid.pdf'));
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
