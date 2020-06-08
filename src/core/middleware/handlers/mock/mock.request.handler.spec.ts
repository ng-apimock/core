import * as http from 'http';
import * as path from 'path';

import * as fs from 'fs-extra';
import { Container } from 'inversify';
import { createSpyObj } from 'jest-createspyobj';

import { Mock } from '../../../mock/mock';
import { MockResponse } from '../../../mock/mock.response';
import { State } from '../../../state/state';
import { HttpHeaders, HttpMethods, HttpStatusCode } from '../../http';

import { MockRequestHandler } from './mock.request.handler';

jest.mock('fs-extra');
jest.useFakeTimers();

describe('MockRequestHandler', () => {
    let container: Container;
    let mockRequestHandler: MockRequestHandler;
    let state: jest.Mocked<State>;

    beforeEach(() => {
        container = new Container();
        state = createSpyObj(State);

        container.bind('MockRequestHandler').to(MockRequestHandler);
        container.bind('State').toConstantValue(state);

        mockRequestHandler = container.get<MockRequestHandler>('MockRequestHandler');
    });

    describe('handle', () => {
        let fsReadFileSyncFn: jest.Mock;
        let getJsonCallbackNameFn: jest.SpyInstance<string | boolean>;
        let interpolateResponseDataFn: jest.SpyInstance<string>;
        let nextFn: jest.Mock;
        let request: http.IncomingMessage;
        let response: http.ServerResponse;

        beforeEach(() => {
            nextFn = jest.fn();
            request = {} as http.IncomingMessage;
            response = {
                end: jest.fn(),
                writeHead: jest.fn()
            } as unknown as http.ServerResponse;

            fsReadFileSyncFn = fs.readFileSync as jest.Mock;
            getJsonCallbackNameFn = jest.spyOn(mockRequestHandler, 'getJsonCallbackName');
            interpolateResponseDataFn = jest.spyOn(mockRequestHandler, 'interpolateResponseData');
        });

        describe('selected response', () => {
            describe('binary', () => {
                let mockResponse: MockResponse;

                beforeEach(() => {
                    mockResponse = {
                        status: HttpStatusCode.OK,
                        headers: HttpHeaders.CONTENT_TYPE_BINARY,
                        file: 'some.pdf'
                    };
                    state.getResponse.mockReturnValue(mockResponse);
                    state.getDelay.mockReturnValue(1000);
                    fsReadFileSyncFn.mockReturnValue('binary content');
                    getJsonCallbackNameFn.mockReturnValue(false);
                });

                it('reads the binary content and returns it as response', () => {
                    mockRequestHandler.handle(request as any, response as any, nextFn, {
                        id: 'apimockId',
                        mock: {
                            path: 'path/to',
                            name: 'some',
                            request: { method: HttpMethods.GET, url: '/some/url' }
                        } as Mock
                    });

                    expect(state.getResponse).toHaveBeenCalledWith('some', 'apimockId');
                    expect(state.getDelay).toHaveBeenCalledWith('some', 'apimockId');
                    expect(fsReadFileSyncFn).toHaveBeenCalledWith(path.join('path', 'to', 'some.pdf'));

                    jest.runAllTimers();

                    expect(response.writeHead).toHaveBeenCalledWith(HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_BINARY);
                    expect(response.end).toHaveBeenCalledWith('binary content');
                    expect(response.writeHead).toHaveBeenCalledTimes(1);
                    expect(response.end).toHaveBeenCalledTimes(1);
                });

                it('throws an error when the binary file cannot be read', () => {
                    fsReadFileSyncFn.mockImplementation(() => {
                        throw new Error('Error');
                    });
                    mockRequestHandler.handle(request as any, response as any, nextFn, {
                        id: 'apimockId',
                        mock: {
                            path: 'path/to',
                            name: 'some',
                            request: { method: HttpMethods.GET, url: '/some/url' }
                        } as Mock
                    });

                    expect(state.getResponse).toHaveBeenCalledWith('some', 'apimockId');
                    expect(state.getDelay).toHaveBeenCalledWith('some', 'apimockId');
                    expect(fsReadFileSyncFn).toHaveBeenCalledWith('path/to/some.pdf');

                    jest.runAllTimers();

                    expect(response.writeHead).toHaveBeenCalledWith(HttpStatusCode.INTERNAL_SERVER_ERROR, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
                    expect(response.end).toHaveBeenCalledWith(JSON.stringify({ message: 'Error' }));
                    expect(response.writeHead).toHaveBeenCalledTimes(1);
                    expect(response.end).toHaveBeenCalledTimes(1);
                });

                it('wraps the body in a json callback', () => {
                    getJsonCallbackNameFn.mockReturnValue('callback');
                    mockRequestHandler.handle(request as any, response as any, nextFn, {
                        id: 'apimockId',
                        mock: {
                            name: 'some',
                            path: 'path/to',
                            request: { method: HttpMethods.GET, url: '/some/url' }
                        } as Mock
                    });

                    jest.runAllTimers();

                    expect(response.writeHead).toHaveBeenCalledWith(HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_BINARY);
                    expect(response.end).toHaveBeenCalledWith('callback(binary content)');
                    expect(response.writeHead).toHaveBeenCalledTimes(1);
                    expect(response.end).toHaveBeenCalledTimes(1);
                });
            });

            describe('json', () => {
                let mockResponse: MockResponse;
                let variables: any;

                beforeEach(() => {
                    mockResponse = {
                        status: HttpStatusCode.OK,
                        headers: HttpHeaders.CONTENT_TYPE_APPLICATION_JSON,
                        data: { a: 'a%%x%%' }
                    };
                    variables = { x: 'x' };
                    state.getResponse.mockReturnValue(mockResponse);
                    state.getVariables.mockReturnValue(variables);
                    state.getDelay.mockReturnValue(1000);
                    interpolateResponseDataFn.mockReturnValue('interpolatedResponseData');
                    getJsonCallbackNameFn.mockReturnValue(false);
                });

                it('interpolates the data and returns it as response', () => {
                    mockRequestHandler.handle(request as any, response as any, nextFn, {
                        id: 'apimockId',
                        mock: {
                            name: 'some', request: { method: HttpMethods.GET, url: '/some/url' }
                        } as Mock
                    });

                    expect(state.getResponse).toHaveBeenCalledWith('some', 'apimockId');
                    expect(state.getVariables).toHaveBeenCalledWith('apimockId');
                    expect(state.getDelay).toHaveBeenCalledWith('some', 'apimockId');
                    expect(fsReadFileSyncFn).toHaveBeenCalledWith('path/to/some.pdf');

                    expect(interpolateResponseDataFn).toHaveBeenCalledWith(JSON.stringify(mockResponse.data), variables);

                    jest.runAllTimers();

                    expect(response.writeHead).toHaveBeenCalledWith(HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
                    expect(response.end).toHaveBeenCalledWith('interpolatedResponseData');
                    expect(response.writeHead).toHaveBeenCalledTimes(1);
                    expect(response.end).toHaveBeenCalledTimes(1);
                });

                it('wraps the body in a json callback', () => {
                    getJsonCallbackNameFn.mockReturnValue('callback');
                    mockRequestHandler.handle(request as any, response as any, nextFn, {
                        id: 'apimockId',
                        mock: {
                            name: 'some', request: { method: HttpMethods.GET, url: '/some/url' }
                        } as Mock
                    });

                    jest.runAllTimers();

                    expect(response.writeHead).toHaveBeenCalledWith(HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
                    expect(response.end).toHaveBeenCalledWith('callback(interpolatedResponseData)');
                    expect(response.writeHead).toHaveBeenCalledTimes(1);
                    expect(response.end).toHaveBeenCalledTimes(1);
                });
            });
        });

        describe('no selected response', () => {
            it('calls next()', () => {
                state.getResponse.mockReturnValue(undefined);

                mockRequestHandler.handle(request as any, response as any, nextFn, {
                    id: 'apimockId',
                    mock: {
                        name: 'some',
                        request: {
                            method: HttpMethods.GET,
                            url: '/some/url',
                        }
                    } as Mock
                });

                expect(state.getResponse).toHaveBeenCalledWith('some', 'apimockId');
                expect(state.getVariables).not.toHaveBeenCalled();
                expect(nextFn).toHaveBeenCalled();
            });
        });
    });

    describe('interpolateResponseData', () => {
        it('interpolates available variables', () => expect(mockRequestHandler.interpolateResponseData(JSON.stringify({
            x: 'x is %%x%%',
            y: 'y is %%y%%'
        }), { x: 'XXX' })).toBe('{"x":"x is XXX","y":"y is %%y%%"}'));

        it('interpolates a non string', () => {
            expect(mockRequestHandler.interpolateResponseData(JSON.stringify({
                x: '%%x%%',
                xInString: 'the following %%x%% has been replaced',
                y: '%%y%%'
            }), {
                x: 123,
                y: false
            })).toBe('{"x":123,"xInString":"the following 123 has been replaced","y":false}');
        });
    });

    describe('getJsonCallbackName', () => {
        describe('no query param callback', () => {
            it('returns false', () => expect(mockRequestHandler.getJsonCallbackName({ url: 'some/url' } as http.IncomingMessage)).toBe(false));
        });

        describe('query param callback', () => {
            it('returns the callback name', () => expect(mockRequestHandler.getJsonCallbackName({ url: 'some/url/?callback=callme' } as http.IncomingMessage)).toBe('callme'));
        });
    });
});
