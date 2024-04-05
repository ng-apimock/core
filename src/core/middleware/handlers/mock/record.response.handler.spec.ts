import * as http from 'http';
import * as os from 'os';
import * as path from 'path';

import * as fs from 'fs-extra';
import { Container } from 'inversify';
import { createSpyObj } from 'jest-createspyobj';
import * as uuid from 'uuid';

import { Mock } from '../../../mock/mock';
import { IState } from '../../../state/Istate';
import { Recording } from '../../../state/recording';
import { State } from '../../../state/state';
import { HttpMethods, HttpStatusCode } from '../../http';

import { RecordResponseHandler } from './record.response.handler';

jest.mock('fs-extra');
jest.mock('uuid');

describe('RecordResponseHandler', () => {
    let container: Container;
    let recordResponseHandler: RecordResponseHandler;
    let state: jest.Mocked<State>;

    beforeEach(() => {
        container = new Container();
        state = createSpyObj(State);

        container.bind('Configuration').toConstantValue({ middleware: { basePath: '/base-path' } });
        container.bind('RecordResponseHandler').to(RecordResponseHandler);
        container.bind('State').toConstantValue(state);

        recordResponseHandler = container.get<RecordResponseHandler>('RecordResponseHandler');
    });

    describe('handle', () => {
        let nextFn: jest.Mock;
        let request: http.IncomingMessage;
        let response: http.ServerResponse;

        let fetchResponseFn: jest.SpyInstance;
        let recordFn: jest.Mocked<any>;
        let responseBufferFn: jest.Mocked<any>;
        let responseHeadersGetFn: jest.Mocked<any>;
        let responseHeadersRawFn: jest.Mocked<any>;

        beforeEach(() => {
            nextFn = jest.fn();
            request = {} as http.IncomingMessage;
            response = {
                end: jest.fn(),
                writeHead: jest.fn()
            } as unknown as http.ServerResponse;

            request.url = '/some/api';
            request.method = HttpMethods.GET;
            request.headers = { host: 'localhost:8888' };
            responseBufferFn = jest.fn();
            responseHeadersRawFn = jest.fn();
            responseHeadersGetFn = jest.fn();

            recordFn = jest.spyOn(recordResponseHandler, 'record');
            fetchResponseFn = jest.spyOn(recordResponseHandler, 'fetchResponse');

            responseBufferFn.mockReturnValue('the-data');
            responseHeadersRawFn.mockReturnValue({ 'Content-Type': 'application/pdf' });
        });

        describe('by default', () => {
            beforeEach(() => {
                fetchResponseFn.mockResolvedValue({
                    buffer: responseBufferFn, headers: { raw: responseHeadersRawFn }, status: 200
                });
            });

            describe('method GET', () => {
                beforeEach(() => {
                    request.method = HttpMethods.GET;

                    recordResponseHandler.handle(request, response as any, nextFn, {
                        id: 'apimockId',
                        mock: { name: 'some' } as Mock,
                        body: JSON.stringify({ x: 'x' })
                    });
                });

                it('sets the record header to true', () => expect(request.headers.record).toBe('true'));

                it('calls the api without body', async () => {
                    expect(fetchResponseFn).toHaveBeenCalled();
                    const actualRequest = fetchResponseFn.mock.calls[0][0];
                    expect(actualRequest.url).toBe('http://localhost:8888/some/api');
                    expect(actualRequest.method).toBe(HttpMethods.GET);
                    expect(actualRequest.body).toEqual(null);
                    expect(actualRequest.headers.get('host')).toBe('localhost:8888');
                    expect(actualRequest.headers.get('record')).toBe('true');
                });
            });

            describe('method HEAD', () => {
                beforeEach(() => {
                    request.method = HttpMethods.HEAD;

                    recordResponseHandler.handle(request, response as any, nextFn, {
                        id: 'apimockId',
                        mock: { name: 'some' } as Mock,
                        body: JSON.stringify({ x: 'x' })
                    });
                });

                it('sets the record header to true', () => expect(request.headers.record).toBe('true'));

                it('calls the api without body', async () => {
                    expect(fetchResponseFn).toHaveBeenCalled();
                    const actualRequest = fetchResponseFn.mock.calls[0][0];
                    expect(actualRequest.url).toBe('http://localhost:8888/some/api');
                    expect(actualRequest.method).toBe(HttpMethods.HEAD);
                    expect(actualRequest.body).toEqual(null);
                    expect(actualRequest.headers.get('host')).toBe('localhost:8888');
                    expect(actualRequest.headers.get('record')).toBe('true');
                });
            });

            describe('method OTHER', () => {
                beforeEach(() => {
                    request.method = HttpMethods.POST;

                    recordResponseHandler.handle(request, response as any, nextFn, {
                        id: 'apimockId',
                        mock: { name: 'some' } as Mock,
                        body: { x: 'x' }
                    });
                });

                it('sets the record header to true', () => expect(request.headers.record).toBe('true'));

                it('calls the api without body', async () => {
                    expect(fetchResponseFn).toHaveBeenCalled();
                    const actualRequest = fetchResponseFn.mock.calls[0][0];
                    expect(actualRequest.url).toBe('http://localhost:8888/some/api');
                    expect(actualRequest.method).toBe(HttpMethods.POST);
                    expect(actualRequest.body).not.toEqual(null);
                    expect(actualRequest.headers.get('host')).toBe('localhost:8888');
                    expect(actualRequest.headers.get('record')).toBe('true');
                });
            });
        });

        describe('with ipAddress configured', () => {
            beforeEach(() => {
                container.rebind('Configuration').toConstantValue({ middleware: { basePath: '/base-path', ipAddress: 'some-ip' } });

                recordResponseHandler = container.get<RecordResponseHandler>('RecordResponseHandler');
                recordFn = jest.spyOn(recordResponseHandler, 'record');
                fetchResponseFn = jest.spyOn(recordResponseHandler, 'fetchResponse');

                fetchResponseFn.mockResolvedValue({
                    buffer: responseBufferFn, headers: { raw: responseHeadersRawFn }, status: 200
                });
            });

            describe('method GET', () => {
                beforeEach(() => {
                    request.method = HttpMethods.GET;

                    recordResponseHandler.handle(request, response as any, nextFn, {
                        id: 'apimockId',
                        mock: { name: 'some' } as Mock,
                        body: JSON.stringify({ x: 'x' })
                    });
                });

                it('sets the record header to true', () => expect(request.headers.record).toBe('true'));

                it('calls the api without body', async () => {
                    expect(fetchResponseFn).toHaveBeenCalled();
                    const actualRequest = fetchResponseFn.mock.calls[0][0];
                    expect(actualRequest.url).toBe('http://some-ip:8888/some/api');
                    expect(actualRequest.method).toBe(HttpMethods.GET);
                    expect(actualRequest.body).toEqual(null);
                    expect(actualRequest.headers.get('host')).toBe('localhost:8888');
                    expect(actualRequest.headers.get('record')).toBe('true');
                });
            });

            describe('method HEAD', () => {
                beforeEach(() => {
                    request.method = HttpMethods.HEAD;

                    recordResponseHandler.handle(request, response as any, nextFn, {
                        id: 'apimockId',
                        mock: { name: 'some' } as Mock,
                        body: JSON.stringify({ x: 'x' })
                    });
                });

                it('sets the record header to true', () => expect(request.headers.record).toBe('true'));

                it('calls the api without body', async () => {
                    expect(fetchResponseFn).toHaveBeenCalled();
                    const actualRequest = fetchResponseFn.mock.calls[0][0];
                    expect(actualRequest.url).toBe('http://some-ip:8888/some/api');
                    expect(actualRequest.method).toBe(HttpMethods.HEAD);
                    expect(actualRequest.body).toEqual(null);
                    expect(actualRequest.headers.get('host')).toBe('localhost:8888');
                    expect(actualRequest.headers.get('record')).toBe('true');
                });
            });

            describe('method OTHER', () => {
                beforeEach(() => {
                    request.method = HttpMethods.POST;

                    recordResponseHandler.handle(request, response as any, nextFn, {
                        id: 'apimockId',
                        mock: { name: 'some' } as Mock,
                        body: { x: 'x' }
                    });
                });

                it('sets the record header to true', () => expect(request.headers.record).toBe('true'));

                it('calls the api without body', async () => {
                    expect(fetchResponseFn).toHaveBeenCalled();
                    const actualRequest = fetchResponseFn.mock.calls[0][0];
                    expect(actualRequest.url).toBe('http://some-ip:8888/some/api');
                    expect(actualRequest.method).toBe(HttpMethods.POST);
                    expect(actualRequest.body).not.toEqual(null);
                    expect(actualRequest.headers.get('host')).toBe('localhost:8888');
                    expect(actualRequest.headers.get('record')).toBe('true');
                });
            });
        });

        describe('on successful api call', () => {
            beforeEach(async () => {
                responseHeadersGetFn.mockReturnValue('application/pdf');
                fetchResponseFn.mockResolvedValue({
                    buffer: responseBufferFn,
                    headers: { raw: responseHeadersRawFn, get: responseHeadersGetFn },
                    status: 200
                });
                recordFn.mockImplementation(() => {});

                await recordResponseHandler.handle(request, response as any, nextFn, {
                    id: 'apimockId',
                    mock: { name: 'some' } as Mock,
                    body: JSON.stringify({ x: 'x' })
                });
            });

            it('on request data record', async () => {
                expect(recordFn).toHaveBeenCalled();
                const actualRequest = recordFn.mock.calls[0][2];
                expect(actualRequest.request.url).toBe('/some/api');
                expect(actualRequest.request.method).toBe(HttpMethods.GET);
                expect(actualRequest.request.headers.host).toBe('localhost:8888');
                expect(actualRequest.request.headers.record).toBe('true');
                expect(actualRequest.request.body).toBe(JSON.stringify({ x: 'x' }));

                expect(actualRequest.response.data).toBe('the-data');
                expect(actualRequest.response.status).toBe(HttpStatusCode.OK);
                expect(actualRequest.response.headers).toEqual({ 'Content-Type': 'application/pdf' });
            });

            it('returns the response', async () => {
                expect(response.writeHead).toHaveBeenCalledWith(HttpStatusCode.OK, { 'Content-Type': 'application/pdf' });
                expect(response.end).toHaveBeenCalledWith('the-data');
            });
        });

        describe('on unsuccessful api call', () => {
            let rejectedPromise: Promise<any>;
            beforeEach(() => {
                fetchResponseFn.mockRejectedValue({ message: 'oops' });
            });

            it('returns the error response', async () => {
                await recordResponseHandler.handle(request, response as any, nextFn, {
                    id: 'apimockId',
                    mock: { name: 'some' } as Mock,
                    body: JSON.stringify({ x: 'x' })
                });
                expect(response.end).toHaveBeenCalledWith('oops');
            });
        });
    });

    describe('record', () => {
        let fsWriteFileSyncFn: jest.Mock;
        let matchingState: IState;
        let recording: Recording;
        let uuidV4Fn: jest.Mock;

        beforeEach(() => {
            fsWriteFileSyncFn = fs.writeFileSync as jest.Mock;
            matchingState = {
                mocks: {},
                variables: {},
                recordings: {},
                record: false
            };
            state.getMatchingState.mockReturnValue(matchingState);

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

            uuidV4Fn = uuid.v4 as jest.Mock;
            uuidV4Fn.mockReturnValue('generated-uuid');
        });

        describe('applicable mimetype', () => {
            beforeEach(() => {
                recording.response.contentType = 'application/json';

                recordResponseHandler.record('apimockId', 'identifier', recording);
            });

            it('stores the recording', () => {
                const actual = matchingState.recordings.identifier[0];
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
            beforeEach(() => {
                recording.response.contentType = 'application/pdf';

                recordResponseHandler.record('apimockId', 'identifier', recording);
            });

            it('stores the recording', () => {
                const actual = matchingState.recordings.identifier[0];
                expect(actual.request.url).toBe('/some/url');
                expect(actual.request.method).toBe(HttpMethods.GET);
                expect(actual.request.headers).toEqual({ host: 'localhost:8888' });
                expect(actual.request.body).toEqual({ 'some-key': 'some-value' });

                // updates the data
                expect(actual.response.data).toBe('{"apimockFileLocation":"/base-path/recordings/generated-uuid.pdf"}');
                expect(actual.response.status).toEqual(HttpStatusCode.OK);
                expect(actual.response.headers).toEqual({ 'Content-Type': '...' });
            });

            it('saves the data', () => {
                expect(fsWriteFileSyncFn).toHaveBeenCalledWith(path.join(os.tmpdir(), 'generated-uuid.pdf'), expect.anything());
                const data = fsWriteFileSyncFn.mock.calls[0][1];
                expect(data).toEqual(Buffer.from('the-data', 'base64'));
            });
        });
    });
});
