import 'reflect-metadata';
import {Container} from 'inversify';

import * as fs from 'fs-extra';
import * as http from 'http';
import * as sinon from 'sinon';

import Mock from '../../../mock/mock';
import MockRequestHandler from './mock.request.handler';
import MockResponse from '../../../mock/mock.response';
import MocksState from '../../../state/mocks.state';
import {HttpHeaders, HttpMethods, HttpStatusCode} from '../../http';

describe('MockRequestHandler', () => {
    let clock: sinon.SinonFakeTimers;
    let container: Container;
    let fsReadFileSyncFn: sinon.SinonStub;
    let getJsonCallbackNameFn: sinon.SinonStub;
    let interpolateResponseDataFn: sinon.SinonStub;
    let mockRequestHandler: MockRequestHandler;
    let mocksState: sinon.SinonStubbedInstance<MocksState>;
    let nextFn: sinon.SinonStub;
    let request: sinon.SinonStubbedInstance<http.IncomingMessage>;
    let response: sinon.SinonStubbedInstance<http.ServerResponse>;

    beforeAll(() => {
        clock = sinon.useFakeTimers();
        container = new Container();
        mocksState = sinon.createStubInstance(MocksState);
        nextFn = sinon.stub();
        request = sinon.createStubInstance(http.IncomingMessage);
        response = sinon.createStubInstance(http.ServerResponse);

        container.bind('MocksState').toConstantValue(mocksState);
        container.bind('MockRequestHandler').to(MockRequestHandler);

        mockRequestHandler = container.get<MockRequestHandler>('MockRequestHandler');
        fsReadFileSyncFn = sinon.stub(fs, 'readFileSync');
        getJsonCallbackNameFn = sinon.stub(MockRequestHandler.prototype, 'getJsonCallbackName');
        interpolateResponseDataFn = sinon.stub(MockRequestHandler.prototype, 'interpolateResponseData');
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
                    mocksState.getResponse.returns(mockResponse);
                    mocksState.getDelay.returns(1000);
                    fsReadFileSyncFn.returns('binary content');
                    getJsonCallbackNameFn.returns(false);
                });

                it('reads the binary content and returns it as response', () => {
                    mockRequestHandler.handle(request as any, response, nextFn, {id: 'apimockId', mock: {
        name: 'some',
        request: {
            method: HttpMethods.GET,
            url: '/some/url',
        }
    } as Mock});

                    sinon.assert.calledWith(mocksState.getResponse, ({
        name: 'some',
        request: {
            method: HttpMethods.GET,
            url: '/some/url',
        }
    } as Mock).name, 'apimockId');
                    sinon.assert.calledWith(mocksState.getDelay, ({
        name: 'some',
        request: {
            method: HttpMethods.GET,
            url: '/some/url',
        }
    } as Mock).name, 'apimockId');
                    sinon.assert.calledWith(fsReadFileSyncFn, mockResponse.file);

                    clock.tick(1000);
                    sinon.assert.calledWith(response.writeHead, mockResponse.status, mockResponse.headers);
                    sinon.assert.calledWith(response.end, 'binary content');
                });

                it('wraps the body in a json callback', () => {
                    getJsonCallbackNameFn.returns('callback');
                    mockRequestHandler.handle(request as any, response, nextFn, {id: 'apimockId', mock: {
        name: 'some',
        request: {
            method: HttpMethods.GET,
            url: '/some/url',
        }
    } as Mock});

                    clock.tick(1000);
                    sinon.assert.calledWith(response.writeHead, mockResponse.status, mockResponse.headers);
                    sinon.assert.calledWith(response.end, `callback(${'binary content'})`);
                });

                afterEach(() => {
                    mocksState.getResponse.reset();
                    mocksState.getVariables.reset();
                    mocksState.getDelay.reset();
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
                        data: {'a': 'a%%x%%'}
                    };
                    variables = {x: 'x'};
                    mocksState.getResponse.returns(mockResponse);
                    mocksState.getVariables.returns(variables);
                    mocksState.getDelay.returns(1000);
                    interpolateResponseDataFn.returns('interpolatedResponseData');
                    getJsonCallbackNameFn.returns(false);
                });

                it('interpolates the data and returns it as response', () => {
                    mockRequestHandler.handle(request as any, response, nextFn, {id: 'apimockId', mock: {
        name: 'some',
        request: {
            method: HttpMethods.GET,
            url: '/some/url',
        }
    } as Mock});

                    sinon.assert.calledWith(mocksState.getResponse, ({
        name: 'some',
        request: {
            method: HttpMethods.GET,
            url: '/some/url',
        }
    } as Mock).name, 'apimockId');
                    sinon.assert.calledWith(mocksState.getVariables, 'apimockId');
                    sinon.assert.calledWith(mocksState.getDelay, ({
        name: 'some',
        request: {
            method: HttpMethods.GET,
            url: '/some/url',
        }
    } as Mock).name, 'apimockId');
                    sinon.assert.calledWith(interpolateResponseDataFn, mockResponse.data, variables);

                    clock.tick(1000);
                    sinon.assert.calledWith(response.writeHead, mockResponse.status, mockResponse.headers);
                    sinon.assert.calledWith(response.end, 'interpolatedResponseData');
                });

                it('wraps the body in a json callback', () => {
                    getJsonCallbackNameFn.returns('callback');
                    mockRequestHandler.handle(request as any, response, nextFn, {id: 'apimockId', mock: {
        name: 'some',
        request: {
            method: HttpMethods.GET,
            url: '/some/url',
        }
    } as Mock});

                    clock.tick(1000);
                    sinon.assert.calledWith(response.writeHead, mockResponse.status, mockResponse.headers);
                    sinon.assert.calledWith(response.end, `callback(${'interpolatedResponseData'})`);
                });

                afterEach(() => {
                    mocksState.getResponse.reset();
                    mocksState.getVariables.reset();
                    mocksState.getDelay.reset();
                    getJsonCallbackNameFn.reset();
                    interpolateResponseDataFn.reset();
                    nextFn.reset();
                    fsReadFileSyncFn.reset();
                });
            });
        });

        describe('no selected response', () =>
            it('calls next()', () => {
                mocksState.getResponse.returns(undefined);

                mockRequestHandler.handle(request as any, response, nextFn, {id: 'apimockId', mock: {
        name: 'some',
        request: {
            method: HttpMethods.GET,
            url: '/some/url',
        }
    } as Mock});

                sinon.assert.calledWith(mocksState.getResponse, ({
        name: 'some',
        request: {
            method: HttpMethods.GET,
            url: '/some/url',
        }
    } as Mock).name, 'apimockId');
                sinon.assert.notCalled(mocksState.getVariables);
                sinon.assert.called(nextFn);
            }));

        afterEach(() => {
            mocksState.getResponse.reset();
            mocksState.getVariables.reset();
            mocksState.getDelay.reset();
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
            }, {x: 'XXX'})).toBe('{"x":"x is XXX","y":"y is %%y%%"}'));

    });

    describe('getJsonCallbackName', () => {
        beforeEach(() => {
            getJsonCallbackNameFn.callThrough();
        });
        describe('no query param callback', () =>
            it('returns false', () =>
                expect(mockRequestHandler.getJsonCallbackName({url: 'some/url'} as http.IncomingMessage)).toBe(false)));

        describe('query param callback', () =>
            it('returns the callback name', () =>
                expect(mockRequestHandler.getJsonCallbackName({url: 'some/url/?callback=callme'} as http.IncomingMessage)).toBe('callme')));
    });

    afterAll(() => {
        getJsonCallbackNameFn.restore();
        interpolateResponseDataFn.restore();
        clock.restore();
        fsReadFileSyncFn.restore();
    });
});
