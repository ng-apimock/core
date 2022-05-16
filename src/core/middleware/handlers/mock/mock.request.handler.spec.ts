import * as http from 'http';
import * as path from 'path';

import * as fs from 'fs-extra';
import { Container } from 'inversify';
import { createSpyObj } from 'jest-createspyobj';

import { Mock } from '../../../mock/mock';
import { MockResponse } from '../../../mock/mock.response';
import { IState } from '../../../state/Istate';
import { MockState } from '../../../state/mock.state';
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
        let getChunkFn: jest.SpyInstance;
        let getJsonCallbackNameFn: jest.SpyInstance;
        let respondFn: jest.SpyInstance;
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

            getChunkFn = jest.spyOn(mockRequestHandler as any, 'getChunk');
            getJsonCallbackNameFn = jest.spyOn(mockRequestHandler as any, 'getJsonCallbackName');
            respondFn = jest.spyOn(mockRequestHandler as any, 'respond');
        });

        describe('selected response', () => {
            let mockResponse: MockResponse;
            let matchingState: IState;
            let params: any;

            beforeEach(() => {
                mockResponse = {
                    data: 'data',
                    headers: { 'Content-Type': 'application/json' },
                    status: 200,
                    then: { mocks: [] }
                };
                matchingState = { mocks: { some: { counter: 0 } } } as unknown as IState;
                params = {
                    id: 'apimockId',
                    mock: {
                        path: 'path/to',
                        name: 'some',
                        request: { method: HttpMethods.GET, url: '/some/url' }
                    } as Mock
                };

                state.getResponse.mockReturnValue(mockResponse);
                state.getDelay.mockReturnValue(1000);
                state.getMatchingState.mockReturnValue(matchingState);
                getJsonCallbackNameFn.mockReturnValue(false);
                getChunkFn.mockReturnValue('chunk');
            });

            it('gets the chunk', () => {
                mockRequestHandler.handle(request as any, response as any, nextFn, params);

                expect(state.getResponse).toHaveBeenCalledWith('some', 'apimockId');
                expect(state.getDelay).toHaveBeenCalledWith('some', 'apimockId');
                expect(getJsonCallbackNameFn).toHaveBeenCalledWith(request);
                expect(getChunkFn).toHaveBeenCalledWith(mockResponse, params, false);
            });

            it('sends the respond after the delay time has passed', () => {
                mockRequestHandler.handle(request as any, response as any, nextFn, params);

                jest.runAllTimers();
                expect(respondFn).toHaveBeenCalledWith(params, { mocks: [] }, response, 200, { 'Content-Type': 'application/json' }, 'chunk');
            });

            it('throws an error when the something goes wrong', () => {
                getChunkFn.mockImplementation(() => {
                    throw new Error('Error');
                });

                mockRequestHandler.handle(request as any, response as any, nextFn, params);

                expect(state.getResponse).toHaveBeenCalledWith('some', 'apimockId');
                expect(state.getDelay).toHaveBeenCalledWith('some', 'apimockId');
                expect(getJsonCallbackNameFn).toHaveBeenCalledWith(request);
                expect(getChunkFn).toHaveBeenCalledWith(mockResponse, params, false);

                expect(response.writeHead).toHaveBeenCalledWith(HttpStatusCode.INTERNAL_SERVER_ERROR, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
                expect(response.end).toHaveBeenCalledWith(JSON.stringify({ message: 'Error' }));
                expect(response.writeHead).toHaveBeenCalledTimes(1);
                expect(response.end).toHaveBeenCalledTimes(1);
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

    describe('getChunk', () => {
        describe('binary', () => {
            describe('json', () => {
                let fsReadFileSyncFn: jest.Mock;
                let interpolateResponseDataFn: jest.SpyInstance;
                let mockResponse: MockResponse;
                let params: any;
                let variables: any;

                beforeEach(() => {
                    fsReadFileSyncFn = fs.readFileSync as jest.Mock;
                    interpolateResponseDataFn = jest.spyOn(mockRequestHandler as any, 'interpolateResponseData');
                    mockResponse = {
                        status: HttpStatusCode.OK,
                        headers: HttpHeaders.CONTENT_TYPE_APPLICATION_JSON,
                        file: 'some.json'
                    };
                    params = { mock: { path: '/path/to' } };

                    fsReadFileSyncFn.mockReturnValue({ some: '%%x%%' });
                    variables = { x: 'x' };
                    state.getVariables.mockReturnValue(variables);
                    interpolateResponseDataFn.mockReturnValue('interpolated binary response data');
                });

                it('reads the binary content', () => {
                    (mockRequestHandler as any).getChunk(mockResponse, params, false);

                    expect(fsReadFileSyncFn).toHaveBeenCalledWith(path.join('/path/to', 'some.json'));
                });

                it('returns the response', () => {
                    const chunk = (mockRequestHandler as any).getChunk(mockResponse, params, false);
                    expect(chunk).toEqual('interpolated binary response data');
                });

                it('returns the wrapped body in a json callback', () => {
                    const chunk = (mockRequestHandler as any).getChunk(mockResponse, params, 'callbackName');
                    expect(chunk).toEqual('callbackName(interpolated binary response data)');
                });
            });

            describe('non-json', () => {
                let fsReadFileSyncFn: jest.Mock;
                let mockResponse: MockResponse;
                let params: any;

                beforeEach(() => {
                    fsReadFileSyncFn = fs.readFileSync as jest.Mock;
                    mockResponse = {
                        status: HttpStatusCode.OK,
                        headers: HttpHeaders.CONTENT_TYPE_BINARY,
                        file: 'some.pdf'
                    };
                    params = { mock: { path: '/path/to' } };

                    fsReadFileSyncFn.mockReturnValue('binary content');
                });

                it('reads the binary content', () => {
                    (mockRequestHandler as any).getChunk(mockResponse, params, false);

                    expect(fsReadFileSyncFn).toHaveBeenCalledWith(path.join('/path/to', 'some.pdf'));
                });

                it('returns the response', () => {
                    const chunk = (mockRequestHandler as any).getChunk(mockResponse, params, false);
                    expect(chunk).toEqual('binary content');
                });

                it('returns the wrapped body in a json callback', () => {
                    const chunk = (mockRequestHandler as any).getChunk(mockResponse, params, 'callbackName');
                    expect(chunk).toEqual('callbackName(binary content)');
                });
            });
        });

        describe('json', () => {
            let interpolateResponseDataFn: jest.SpyInstance;
            let mockResponse: MockResponse;
            let params: any;
            let variables: any;

            beforeEach(() => {
                interpolateResponseDataFn = jest.spyOn(mockRequestHandler as any, 'interpolateResponseData');
                mockResponse = {
                    status: HttpStatusCode.OK,
                    headers: HttpHeaders.CONTENT_TYPE_APPLICATION_JSON,
                    data: { a: 'a%%x%%' }
                };
                params = { mock: { path: '/path/to' } };

                variables = { x: 'x' };
                state.getVariables.mockReturnValue(variables);
                interpolateResponseDataFn.mockReturnValue('interpolated response data');
            });

            it('interpolates the data and returns it as response', () => {
                const chunk = (mockRequestHandler as any).getChunk(mockResponse, params, false);

                expect(interpolateResponseDataFn).toHaveBeenCalledWith(JSON.stringify(mockResponse.data), variables);
                expect(chunk).toEqual('interpolated response data');
            });

            it('returns the wrapped body in a json callback', () => {
                const chunk = (mockRequestHandler as any).getChunk(mockResponse, params, 'callbackName');
                expect(chunk).toEqual('callbackName(interpolated response data)');
            });
        });
    });

    describe('getJsonCallbackName', () => {
        describe('no query param callback', () => {
            it('returns false', () => {
                const jsonCallbackName = (mockRequestHandler as any).getJsonCallbackName({ url: 'some/url' } as http.IncomingMessage);
                expect(jsonCallbackName).toBe(false);
            });
        });

        describe('query param callback', () => {
            it('returns the callback name', () => {
                const jsonCallbackName = (mockRequestHandler as any).getJsonCallbackName({ url: 'some/url/?callback=callme' } as http.IncomingMessage);
                expect(jsonCallbackName).toBe('callme');
            });
        });
    });

    describe('interpolateResponseData', () => {
        it('interpolates available variables', () => {
            const interpolateResponseData = (mockRequestHandler as any).interpolateResponseData(JSON.stringify({
                x: 'x is %%x%%',
                y: 'y is %%y%%'
            }), { x: 'XXX' });
            expect(interpolateResponseData).toBe('{"x":"x is XXX","y":"y is %%y%%"}');
        });

        it('interpolates a non string', () => {
            const interpolateResponseData = (mockRequestHandler as any).interpolateResponseData(JSON.stringify({
                x: '%%x%%',
                xInString: 'the following %%x%% has been replaced',
                y: '%%y%%'
            }), {
                x: 123,
                y: false
            });
            expect(interpolateResponseData).toBe('{"x":123,"xInString":"the following 123 has been replaced","y":false}');
        });

        it('interpolates an object', () => {
            const interpolateResponseData = (mockRequestHandler as any).interpolateResponseData(JSON.stringify({
                x: '%%x%%',
                xInString: 'the following %%x%% has been replaced',
                y: '%%y%%'
            }), {
                x: 123,
                y: { some: 'thing' }
            });
            expect(interpolateResponseData).toEqual('{"x":123,"xInString":"the following 123 has been replaced","y":{"some":"thing"}}');
        });
    });

    describe('handleThenCriteria', () => {
        let matchingState: IState;
        let matchingMockState: MockState;

        beforeEach(() => {
            matchingMockState = { scenario: 'the default', counter: 2 };
            matchingState = {
                mocks: {
                    some: matchingMockState,
                    another: { scenario: 'the default', counter: 1 }
                }
            } as unknown as IState;
        });

        describe('no criteria', () => {
            beforeEach(() => {
                (mockRequestHandler as any).handleThenCriteria({ mocks: [{ scenario: 'some scenario' }] }, matchingMockState, matchingState);
            });

            it('selects the scenario', () => {
                expect(matchingMockState.scenario).toEqual('some scenario');
            });

            it('resets the counter', () => {
                expect(matchingMockState.counter).toEqual(0);
                expect(matchingState.mocks.another.counter).toEqual(1);
            });
        });

        describe('with criteria that matches', () => {
            beforeEach(() => {
                (mockRequestHandler as any).handleThenCriteria({
                    criteria: { times: 2 },
                    mocks: [{ scenario: 'some scenario' }]
                }, matchingMockState, matchingState);
            });

            it('selects the scenario', () => {
                expect(matchingMockState.scenario).toEqual('some scenario');
            });

            it('resets the counter', () => {
                expect(matchingMockState.counter).toEqual(0);
                expect(matchingState.mocks.another.counter).toEqual(1);
            });
        });

        describe('with criteria that does not match', () => {
            beforeEach(() => {
                (mockRequestHandler as any).handleThenCriteria({
                    criteria: { times: 3 },
                    mocks: [{ scenario: 'some scenario' }]
                }, matchingMockState, matchingState);
            });

            it('does not select the scenario', () => {
                expect(matchingMockState.scenario).toEqual('the default');
            });

            it('does not reset the counter', () => {
                expect(matchingMockState.counter).toEqual(2);
                expect(matchingState.mocks.another.counter).toEqual(1);
            });
        });

        describe('with empty criteria', () => {
            beforeEach(() => {
                (mockRequestHandler as any).handleThenCriteria({
                    criteria: {},
                    mocks: [{ scenario: 'some scenario' }]
                }, matchingMockState, matchingState);
            });

            it('selects the scenario', () => {
                expect(matchingMockState.scenario).toEqual('some scenario');
            });

            it('resets the counter', () => {
                expect(matchingMockState.counter).toEqual(0);
                expect(matchingState.mocks.another.counter).toEqual(1);
            });
        });

        describe('with criteria that matches but no matching mock', () => {
            let consoleErrorFn: jest.SpyInstance;

            beforeEach(() => {
                consoleErrorFn = jest.spyOn(console, 'error');
                (mockRequestHandler as any).handleThenCriteria({
                    criteria: { times: 2 },
                    mocks: [{ name: 'no-match', scenario: 'some scenario' }]
                }, matchingMockState, matchingState);
            });

            it('does not select the scenario', () => {
                expect(matchingMockState.scenario).toEqual('the default');
            });

            it('resets the counter', () => {
                expect(matchingMockState.counter).toEqual(2);
                expect(matchingState.mocks.another.counter).toEqual(1);
            });

            it('logs the error', () => {
                expect(consoleErrorFn).toHaveBeenCalledWith('No scenario matching name [no-match] exists');
            });
        });
    });

    describe('respond', () => {
        let headers: any;
        let handleThenCriteriaFn: jest.SpyInstance;
        let matchingState: IState;
        let params: any;
        let response: http.ServerResponse;

        beforeEach(() => {
            headers = { 'Content-Type': 'application/json' };
            matchingState = {
                mocks: {
                    some: { scenario: 'the default', counter: 1 }
                }
            } as unknown as IState;

            params = {
                id: 'apimockId',
                mock: {
                    name: 'some',
                    request: {
                        method: HttpMethods.GET,
                        url: '/some/url',
                    }
                } as Mock
            };

            response = {
                end: jest.fn(),
                writeHead: jest.fn()
            } as unknown as http.ServerResponse;

            handleThenCriteriaFn = jest.spyOn(mockRequestHandler as any, 'handleThenCriteria');

            state.getMatchingState.mockReturnValue(matchingState);
        });

        describe('default', () => {
            beforeEach(() => {
                (mockRequestHandler as any).respond(params, undefined, response, 200, headers, 'chunk');
            });

            it('updates the counter', () => {
                expect(matchingState.mocks.some.counter).toBe(2);
                expect(response.end).toHaveBeenCalledWith('chunk');
            });

            it('writes the data to the response', () => {
                expect(response.writeHead).toHaveBeenCalledWith(HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
                expect(response.end).toHaveBeenCalledWith('chunk');
            });

            it('does not have a then criteria', () => {
                expect(handleThenCriteriaFn).not.toHaveBeenCalled();
            });
        });

        describe('then clause', () => {
            beforeEach(() => {
                (mockRequestHandler as any).respond(params, { mocks: [] }, response, 200, headers, 'chunk');
            });

            it('handles the then criteria', () => {
                expect(handleThenCriteriaFn).toHaveBeenCalledWith({ mocks: [] },
                    { scenario: 'the default', counter: 2 },
                    { mocks: { some: { scenario: 'the default', counter: 2 } } });
            });
        });
    });
});
