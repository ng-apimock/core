import 'reflect-metadata';
import {Container} from 'inversify';

import * as fs from 'fs-extra';
import * as http from 'http';
import {assert, createStubInstance, SinonFakeTimers, SinonStub, SinonStubbedInstance, stub, useFakeTimers} from 'sinon';

import {Mock} from '../../../mock/mock';
import {MockRequestHandler} from './mock.request.handler';
import {MockResponse} from '../../../mock/mock.response';
import {State} from '../../../state/state';
import {HttpHeaders, HttpMethods, HttpStatusCode} from '../../http';

describe('MockRequestHandler', () => {
    let clock: SinonFakeTimers;
    let container: Container;
    let fsReadFileSyncFn: SinonStub;
    let getJsonCallbackNameFn: SinonStub;
    let interpolateResponseDataFn: SinonStub;
    let mockRequestHandler: MockRequestHandler;
    let state: SinonStubbedInstance<State>;
    let nextFn: SinonStub;
    let request: SinonStubbedInstance<http.IncomingMessage>;
    let response: SinonStubbedInstance<http.ServerResponse>;

    beforeAll(() => {
        clock = useFakeTimers();
        container = new Container();
        state = createStubInstance(State);
        nextFn = stub();
        request = createStubInstance(http.IncomingMessage);
        response = createStubInstance(http.ServerResponse);

        container.bind('State').toConstantValue(state);
        container.bind('MockRequestHandler').to(MockRequestHandler);

        mockRequestHandler = container.get<MockRequestHandler>('MockRequestHandler');
        fsReadFileSyncFn = stub(fs, 'readFileSync');
        getJsonCallbackNameFn = stub(MockRequestHandler.prototype, 'getJsonCallbackName');
        interpolateResponseDataFn = stub(MockRequestHandler.prototype, 'interpolateResponseData');
    });

    describe('handle', () => {
        describe('selected response', () => {
            describe('binary', () => {
                let mockResponse: MockResponse;
                beforeEach(() => {
                    mockResponse = {
                        status: HttpStatusCode.OK,
                        headers: HttpHeaders.CONTENT_TYPE_BINARY,
                        file: 'some.pdf'
                    };
                    state.getResponse.returns(mockResponse);
                    state.getDelay.returns(1000);
                    fsReadFileSyncFn.returns('binary content');
                    getJsonCallbackNameFn.returns(false);
                });

                it('reads the binary content and returns it as response', () => {
                    mockRequestHandler.handle(request as any, response, nextFn, {
                        id: 'apimockId', mock: {
                            path: 'path/to',
                            name: 'some',
                            request: {
                                method: HttpMethods.GET,
                                url: '/some/url',
                            }
                        } as Mock
                    });

                    assert.calledWith(state.getResponse, ({
                        name: 'some',
                        request: {
                            method: HttpMethods.GET,
                            url: '/some/url',
                        }
                    } as Mock).name, 'apimockId');
                    assert.calledWith(state.getDelay, ({
                        name: 'some',
                        request: {
                            method: HttpMethods.GET,
                            url: '/some/url',
                        }
                    } as Mock).name, 'apimockId');
                    assert.calledWith(fsReadFileSyncFn, 'path/to/some.pdf');

                    clock.tick(1000);
                    assert.calledWith(response.writeHead, mockResponse.status, mockResponse.headers);
                    assert.calledWith(response.end, 'binary content');
                    assert.callCount(response.writeHead, 1);
                    assert.callCount(response.end, 1);
                });

                it('throws an error when the binary file cannot be read', () => {
                    fsReadFileSyncFn.throwsException();
                    mockRequestHandler.handle(request as any, response, nextFn, {
                        id: 'apimockId', mock: {
                            path: 'path/to',
                            name: 'some',
                            request: {
                                method: HttpMethods.GET,
                                url: '/some/url',
                            }
                        } as Mock
                    });

                    assert.calledWith(state.getResponse, ({
                        name: 'some',
                        request: {
                            method: HttpMethods.GET,
                            url: '/some/url',
                        }
                    } as Mock).name, 'apimockId');
                    assert.calledWith(state.getDelay, ({
                        name: 'some',
                        request: {
                            method: HttpMethods.GET,
                            url: '/some/url',
                        }
                    } as Mock).name, 'apimockId');
                    assert.calledWith(fsReadFileSyncFn, 'path/to/some.pdf');

                    clock.tick(1000);
                    assert.calledWith(response.writeHead, HttpStatusCode.INTERNAL_SERVER_ERROR, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
                    assert.calledWith(response.end, JSON.stringify({ message: 'Error' }));
                    assert.callCount(response.writeHead, 1);
                    assert.callCount(response.end, 1);
                });

                it('wraps the body in a json callback', () => {
                    getJsonCallbackNameFn.returns('callback');
                    mockRequestHandler.handle(request as any, response, nextFn, {
                        id: 'apimockId', mock: {
                            name: 'some',
                            path: 'path/to',
                            request: {
                                method: HttpMethods.GET,
                                url: '/some/url',
                            }
                        } as Mock
                    });

                    clock.tick(1000);
                    assert.calledWith(response.writeHead, mockResponse.status, mockResponse.headers);
                    assert.calledWith(response.end, `callback(${'binary content'})`);
                    assert.callCount(response.writeHead, 1);
                    assert.callCount(response.end, 1);
                });

                afterEach(() => {
                    response.end.reset();
                    response.writeHead.reset();
                    state.getResponse.reset();
                    state.getVariables.reset();
                    state.getDelay.reset();
                    getJsonCallbackNameFn.reset();
                    interpolateResponseDataFn.reset();
                    nextFn.reset();
                    fsReadFileSyncFn.reset();
                });
            });

            describe('json', () => {
                let mockResponse: MockResponse;
                let variables: any;
                beforeEach(() => {
                    mockResponse = {
                        status: HttpStatusCode.OK,
                        headers: HttpHeaders.CONTENT_TYPE_APPLICATION_JSON,
                        data: { 'a': 'a%%x%%' }
                    };
                    variables = { x: 'x' };
                    state.getResponse.returns(mockResponse);
                    state.getVariables.returns(variables);
                    state.getDelay.returns(1000);
                    interpolateResponseDataFn.returns('interpolatedResponseData');
                    getJsonCallbackNameFn.returns(false);
                });

                it('interpolates the data and returns it as response', () => {
                    mockRequestHandler.handle(request as any, response, nextFn, {
                        id: 'apimockId', mock: {
                            name: 'some',
                            request: {
                                method: HttpMethods.GET,
                                url: '/some/url',
                            }
                        } as Mock
                    });

                    assert.calledWith(state.getResponse, ({
                        name: 'some',
                        request: {
                            method: HttpMethods.GET,
                            url: '/some/url',
                        }
                    } as Mock).name, 'apimockId');
                    assert.calledWith(state.getVariables, 'apimockId');
                    assert.calledWith(state.getDelay, ({
                        name: 'some',
                        request: {
                            method: HttpMethods.GET,
                            url: '/some/url',
                        }
                    } as Mock).name, 'apimockId');
                    assert.calledWith(interpolateResponseDataFn, mockResponse.data, variables);

                    clock.tick(1000);
                    assert.calledWith(response.writeHead, mockResponse.status, mockResponse.headers);
                    assert.calledWith(response.end, 'interpolatedResponseData');
                    assert.callCount(response.writeHead, 1);
                    assert.callCount(response.end, 1);
                });

                it('wraps the body in a json callback', () => {
                    getJsonCallbackNameFn.returns('callback');
                    mockRequestHandler.handle(request as any, response, nextFn, {
                        id: 'apimockId', mock: {
                            name: 'some',
                            request: {
                                method: HttpMethods.GET,
                                url: '/some/url',
                            }
                        } as Mock
                    });

                    clock.tick(1000);
                    assert.calledWith(response.writeHead, mockResponse.status, mockResponse.headers);
                    assert.calledWith(response.end, `callback(${'interpolatedResponseData'})`);
                    assert.callCount(response.writeHead, 1);
                    assert.callCount(response.end, 1);
                });

                afterEach(() => {
                    response.end.reset();
                    response.writeHead.reset();
                    state.getResponse.reset();
                    state.getVariables.reset();
                    state.getDelay.reset();
                    getJsonCallbackNameFn.reset();
                    interpolateResponseDataFn.reset();
                    nextFn.reset();
                    fsReadFileSyncFn.reset();
                });
            });
        });

        describe('no selected response', () =>
            it('calls next()', () => {
                state.getResponse.returns(undefined);

                mockRequestHandler.handle(request as any, response, nextFn, {
                    id: 'apimockId', mock: {
                        name: 'some',
                        request: {
                            method: HttpMethods.GET,
                            url: '/some/url',
                        }
                    } as Mock
                });

                assert.calledWith(state.getResponse, ({
                    name: 'some',
                    request: {
                        method: HttpMethods.GET,
                        url: '/some/url',
                    }
                } as Mock).name, 'apimockId');
                assert.notCalled(state.getVariables);
                assert.called(nextFn);
            }));

        afterEach(() => {
            state.getResponse.reset();
            state.getVariables.reset();
            state.getDelay.reset();
            getJsonCallbackNameFn.reset();
            interpolateResponseDataFn.reset();
            nextFn.reset();
            fsReadFileSyncFn.reset();
        });

    });

    describe('interpolateResponseData', () => {
        beforeEach(() => {
            interpolateResponseDataFn.callThrough();
        });

        it('interpolates available variables', () =>
            expect(mockRequestHandler.interpolateResponseData({
                x: 'x is %%x%%',
                y: 'y is %%y%%'
            }, { x: 'XXX' })).toBe(`{'x':'x is XXX','y':'y is %%y%%'}`));

    });

    describe('getJsonCallbackName', () => {
        beforeEach(() => {
            getJsonCallbackNameFn.callThrough();
        });
        describe('no query param callback', () =>
            it('returns false', () =>
                expect(mockRequestHandler.getJsonCallbackName({ url: 'some/url' } as http.IncomingMessage)).toBe(false)));

        describe('query param callback', () =>
            it('returns the callback name', () =>
                expect(mockRequestHandler.getJsonCallbackName({ url: 'some/url/?callback=callme' } as http.IncomingMessage)).toBe('callme')));
    });

    afterAll(() => {
        getJsonCallbackNameFn.restore();
        interpolateResponseDataFn.restore();
        clock.restore();
        fsReadFileSyncFn.restore();
    });
});
