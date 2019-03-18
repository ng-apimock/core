import 'reflect-metadata';
import {Container} from 'inversify';

import * as http from 'http';
import {assert, createStubInstance, SinonStub, SinonStubbedInstance, stub} from 'sinon';

import {DefaultsHandler} from './handlers/api/defaults.handler';
import {EchoRequestHandler} from './handlers/mock/echo.request.handler';
import {Middleware} from './middleware';
import {MockRequestHandler} from './handlers/mock/mock.request.handler';
import {RecordResponseHandler} from './handlers/mock/record.response.handler';
import {UpdateMocksHandler} from './handlers/api/update-mocks.handler';
import {State} from '../state/state';
import {SetVariableHandler} from './handlers/api/set-variable.handler';
import {InitHandler} from './handlers/api/init.handler';
import {GetMocksHandler} from './handlers/api/get-mocks.handler';
import {GetVariablesHandler} from './handlers/api/get-variables.handler';
import {DeleteVariableHandler} from './handlers/api/delete-variable.handler';
import {PassThroughsHandler} from './handlers/api/pass-throughs.handler';
import {ApplicableHandler} from './handlers/handler';
import {HttpMethods} from './http';
import {GetRecordingsHandler} from './handlers/api/get-recordings.handler';
import {GetRecordedResponseHandler} from './handlers/api/get-recorded-response.handler';
import {RecordHandler} from './handlers/api/record.handler';
import {IState} from '../state/Istate';
import {GetPresetsHandler} from './handlers/api/get-presets.handler';
import {SelectPresetHandler} from './handlers/api/select-preset.handler';
import {Configuration, DefaultConfiguration} from '../configuration';


describe('Middleware', () => {
    let applicableHandler: ApplicableHandler;
    let applicableHandlerHandleFn: SinonStub;
    let applicableHandlerIsApplicableFn: SinonStub;
    let container: Container;
    let defaultsHandler: SinonStubbedInstance<DefaultsHandler>;
    let deleteVariableHandler: SinonStubbedInstance<DeleteVariableHandler>;
    let echoRequestHandler: SinonStubbedInstance<EchoRequestHandler>;
    let getApimockIdFn: SinonStub;
    let getApimockIdFromHeaderFn: SinonStub;
    let getApimockIdFromCookieFn: SinonStub;
    let getMatchingApplicableHandlerFn: SinonStub;
    let getMocksHandler: SinonStubbedInstance<GetMocksHandler>;
    let getPresetsHandler: SinonStubbedInstance<GetPresetsHandler>;
    let getVariablesHandler: SinonStubbedInstance<GetVariablesHandler>;
    let getRecordingsHandler: SinonStubbedInstance<GetRecordingsHandler>;
    let initHandler: SinonStubbedInstance<InitHandler>;
    let matchingState: IState;
    let middleware: Middleware;
    let mockRequestHandler: SinonStubbedInstance<MockRequestHandler>;
    let state: SinonStubbedInstance<State>;
    let nextFn: SinonStub;
    let passThroughsHandler: SinonStubbedInstance<PassThroughsHandler>;
    let recordResponseHandler: SinonStubbedInstance<RecordResponseHandler>;
    let recordHandler: SinonStubbedInstance<RecordHandler>;
    let getRecordedResponseHandler: SinonStubbedInstance<GetRecordedResponseHandler>;
    let request: any;
    let jsonBodyParser: SinonStub;
    let response: any;
    let setVariableHandler: SinonStubbedInstance<SetVariableHandler>;
    let selectPresetHandler: SinonStubbedInstance<SelectPresetHandler>;
    let updateMocksHandler: SinonStubbedInstance<UpdateMocksHandler>;

    beforeAll(() => {
        container = new Container();
        state = createStubInstance(State);
        request = createStubInstance(http.IncomingMessage);
        jsonBodyParser = stub();
        response = createStubInstance(http.ServerResponse);
        defaultsHandler = createStubInstance(DefaultsHandler);
        deleteVariableHandler = createStubInstance(DeleteVariableHandler);
        echoRequestHandler = createStubInstance(EchoRequestHandler);
        getMocksHandler = createStubInstance(GetMocksHandler);
        getPresetsHandler = createStubInstance(GetPresetsHandler);
        getVariablesHandler = createStubInstance(GetVariablesHandler);
        getRecordingsHandler = createStubInstance(GetRecordingsHandler);
        applicableHandlerHandleFn = stub();
        applicableHandlerIsApplicableFn = stub();
        applicableHandler = { handle: applicableHandlerHandleFn, isApplicable: applicableHandlerIsApplicableFn };
        initHandler = createStubInstance(InitHandler);
        mockRequestHandler = createStubInstance(MockRequestHandler);
        passThroughsHandler = createStubInstance(PassThroughsHandler);
        recordResponseHandler = createStubInstance(RecordResponseHandler);
        recordHandler = createStubInstance(RecordHandler);
        getRecordedResponseHandler = createStubInstance(GetRecordedResponseHandler);
        setVariableHandler = createStubInstance(SetVariableHandler);
        selectPresetHandler = createStubInstance(SelectPresetHandler);
        updateMocksHandler = createStubInstance(UpdateMocksHandler);

        container.bind<Configuration>('Configuration').toConstantValue(DefaultConfiguration);
        container.bind('DefaultsHandler').toConstantValue(defaultsHandler);
        container.bind('DeleteVariableHandler').toConstantValue(deleteVariableHandler);
        container.bind('EchoRequestHandler').toConstantValue(echoRequestHandler);
        container.bind('GetMocksHandler').toConstantValue(getMocksHandler);
        container.bind('GetPresetsHandler').toConstantValue(getPresetsHandler);
        container.bind('GetRecordingsHandler').toConstantValue(getRecordingsHandler);
        container.bind('GetRecordedResponseHandler').toConstantValue(getRecordedResponseHandler);
        container.bind('GetVariablesHandler').toConstantValue(getVariablesHandler);
        container.bind('InitHandler').toConstantValue(initHandler);
        container.bind('MockRequestHandler').toConstantValue(mockRequestHandler);
        container.bind('PassThroughsHandler').toConstantValue(passThroughsHandler);
        container.bind('RecordHandler').toConstantValue(recordHandler);
        container.bind('RecordResponseHandler').toConstantValue(recordResponseHandler);
        container.bind('SelectPresetHandler').toConstantValue(selectPresetHandler);
        container.bind('SetVariableHandler').toConstantValue(setVariableHandler);
        container.bind('State').toConstantValue(state);
        container.bind('UpdateMocksHandler').toConstantValue(updateMocksHandler);
        container.bind('Middleware').to(Middleware);
        container.bind('JsonBodyParser').toConstantValue(jsonBodyParser);
        nextFn = stub();

        middleware = container.get<Middleware>('Middleware');
        getApimockIdFn = stub(Middleware.prototype, 'getApimockId');
        getApimockIdFromHeaderFn = stub(Middleware.prototype, 'getApimockIdFromHeader');
        getApimockIdFromCookieFn = stub(Middleware.prototype, 'getApimockIdFromCookie');
        getMatchingApplicableHandlerFn = stub(Middleware.prototype, 'getMatchingApplicableHandler');
    });

    describe('middleware', () => {
        describe('matching applicable handler', () => {
            beforeEach(() => {
                getApimockIdFn.returns('apimockId');
                getMatchingApplicableHandlerFn.returns(applicableHandler);
                request.headers = { 'some': 'header' };
                request.body = { 'x': 'x' };

                middleware.middleware(request, response, nextFn);

                jsonBodyParser.getCall(0).callArg(2);

            });

            it('gets the apimock id', () =>
                assert.called(getApimockIdFn));

            it('gets the matching applicable handler', () =>
                assert.calledWith(getMatchingApplicableHandlerFn, request, { x: 'x' }));

            it('calls the handler.handle', () =>
                assert.calledWith(applicableHandlerHandleFn, request, response, nextFn, {
                    id: 'apimockId',
                    body: { x: 'x' }
                }));

            afterEach(() => {
                getApimockIdFn.reset();
                getMatchingApplicableHandlerFn.reset();
                jsonBodyParser.reset();
            });
        });

        describe('matching mock', () => {
            describe('always', () => {
                beforeEach(() => {
                    getApimockIdFn.returns('apimockId');
                    getMatchingApplicableHandlerFn.returns(undefined);
                    state.getMatchingMock.returns({
                        name: 'matching-mock', isArray: true,
                        request: { url: '/base-url', method: HttpMethods.GET }, responses: {}
                    });
                    matchingState = {
                        mocks: {},
                        variables: {},
                        recordings: {},
                        record: false
                    };
                    state.getMatchingState.returns(matchingState);
                    request.url = '/base-url';
                    request.method = HttpMethods.GET;
                    request.headers = { 'some': 'header' };
                    request.body = { 'x': 'x' };

                    middleware.middleware(request, response, nextFn);

                    jsonBodyParser.getCall(0).callArg(2);
                });

                it('gets the apimock id', () =>
                    assert.called(getApimockIdFn));

                it('gets the matching applicable handler', () =>
                    assert.calledWith(getMatchingApplicableHandlerFn, request, { x: 'x' }));

                it('gets the matching mock', () =>
                    assert.calledWith(state.getMatchingMock, '/base-url', HttpMethods.GET, {
                        'some': 'header'
                    }, { x: 'x' }));

                it('calls the echo request handler', () =>
                    assert.calledWith(echoRequestHandler.handle, request, response, nextFn, {
                        id: 'apimockId',
                        mock: {
                            name: 'matching-mock', isArray: true,
                            request: { url: '/base-url', method: HttpMethods.GET }, responses: {}
                        },
                        body: { x: 'x' }
                    }));

                afterEach(() => {
                    getApimockIdFn.reset();
                    getMatchingApplicableHandlerFn.reset();
                    jsonBodyParser.reset();
                });
            });

            describe('recording is enabled', () => {
                beforeEach(() => {
                    matchingState = {
                        mocks: {},
                        variables: {},
                        recordings: {},
                        record: true
                    };
                    state.getMatchingState.returns(matchingState);
                    getApimockIdFn.returns('apimockId');
                    getMatchingApplicableHandlerFn.returns(undefined);
                    state.getMatchingMock.returns({
                        name: 'matching-mock', isArray: true,
                        request: { url: '/base-url', method: HttpMethods.GET }, responses: {}
                    });
                    request.url = '/base-url';
                    request.method = HttpMethods.GET;
                    request.headers = { 'some': 'header' };
                    request.body = { 'x': 'x' };
                });

                describe('record header is present', () => {
                    beforeEach(() => {
                        request.headers.record = 'true';
                        middleware.middleware(request, response, nextFn);

                        jsonBodyParser.getCall(0).callArg(2);
                    });

                    it('does not call the record response handler', () =>
                        assert.notCalled(recordResponseHandler.handle));
                });

                describe('record header is not present', () => {
                    beforeEach(() => {
                        request.headers.record = undefined;
                        middleware.middleware(request, response, nextFn);

                        jsonBodyParser.getCall(0).callArg(2);
                    });

                    it('calls the record response handler', () =>
                        assert.calledWith(recordResponseHandler.handle, request, response, nextFn, {
                            id: 'apimockId',
                            mock: {
                                name: 'matching-mock', isArray: true,
                                request: { url: '/base-url', method: HttpMethods.GET }, responses: {}
                            },
                            body: { x: 'x' }
                        }));

                });

                afterEach(() => {
                    getApimockIdFn.reset();
                    getMatchingApplicableHandlerFn.reset();
                    recordResponseHandler.handle.reset();
                    jsonBodyParser.reset();
                });
            });

            describe('recording is disabled', () => {
                beforeEach(() => {
                    matchingState = {
                        mocks: {},
                        variables: {},
                        recordings: {},
                        record: false
                    };
                    state.getMatchingState.returns(matchingState);
                    getApimockIdFn.returns('apimockId');
                    getMatchingApplicableHandlerFn.returns(undefined);
                    state.getMatchingMock.returns({
                        name: 'matching-mock', isArray: true,
                        request: { url: '/base-url', method: HttpMethods.GET }, responses: {}
                    });
                    request.url = '/base-url';
                    request.method = HttpMethods.GET;
                    request.headers = { 'some': 'header' };
                    request.body = { 'x': 'x' };

                    middleware.middleware(request, response, nextFn);

                    jsonBodyParser.getCall(0).callArg(2);
                });

                it('calls the mock request handler', () => assert.calledWith(mockRequestHandler.handle, request,
                    response, nextFn, {
                        id: 'apimockId',
                        mock: {
                            name: 'matching-mock', isArray: true,
                            request: { url: '/base-url', method: HttpMethods.GET }, responses: {}
                        }
                    }));

                afterEach(() => {
                    getApimockIdFn.reset();
                    getMatchingApplicableHandlerFn.reset();
                    mockRequestHandler.handle.reset();
                    jsonBodyParser.reset();
                });
            });
        });

        describe('no matching mock', () => {
            beforeEach(() => {
                getApimockIdFn.returns('apimockId');
                getMatchingApplicableHandlerFn.returns(undefined);
                state.getMatchingMock.returns(undefined);
                request.headers = { 'some': 'header' };
                request.body = { 'x': 'x' };

                middleware.middleware(request, response, nextFn);

                jsonBodyParser.getCall(0).callArg(2);

            });

            it('calls next', () => assert.called(nextFn));

            afterEach(() => {
                getApimockIdFn.reset();
                getMatchingApplicableHandlerFn.reset();
                nextFn.reset();
                jsonBodyParser.reset();
            });
        });
    });

    describe('getMatchingApplicableHandler', () => {
        beforeEach(() => {
            getMatchingApplicableHandlerFn.callThrough();
            getVariablesHandler.isApplicable.returns(true);
        });

        it('finds the applicable handler', () =>
            expect(middleware.getMatchingApplicableHandler(request, { x: 'x' })).toEqual(getVariablesHandler));

        afterEach(() => {
            getMatchingApplicableHandlerFn.reset();
            getVariablesHandler.isApplicable.reset();
        });
    });

    describe('getApimockId', () => {
        beforeEach(() => {
            getApimockIdFn.callThrough();
        });

        describe('configuration use cookie', () => {
            beforeEach(()=> {
                middleware['configuration'].middleware.useHeader = false;
                middleware.getApimockId({some: 'header'});
            });

            it('returns the apimockId from the cookie', () =>
                assert.calledWith(getApimockIdFromCookieFn,{some: 'header'}));
        });

        describe('configuration use header', () => {
            beforeEach(()=> {
                middleware['configuration'].middleware.useHeader = true;
                middleware.getApimockId({some: 'header'});
            });

            it('returns the apimockId from the header', () =>
                assert.calledWith(getApimockIdFromHeaderFn,{some: 'header'}));
        });
    });

    describe('getApimockIdFromHeader', () => {
        beforeEach(() => {
            middleware['configuration'].middleware.identifier = 'my-identifier';
            getApimockIdFromHeaderFn.callThrough();
        });
        describe('apimockId header is present', () =>
            it('returns the identifier', () =>
                expect(middleware.getApimockIdFromHeader({ a: 'a', 'my-identifier': '123', c: 'c' })).toBe('123')));

        describe('apimockId header is not present', () =>
            it('returns undefined', () =>
                expect(middleware.getApimockIdFromHeader({ a: 'a', 'no-matching-identifier': '123', c: 'c' })).toBe(undefined)));
    });

    describe('getApimockIdFromCookie', () => {
        beforeEach(() => {
            middleware['configuration'].middleware.identifier = 'my-identifier';
            getApimockIdFromCookieFn.callThrough();
        });
        describe('apimockId cookie is present', () =>
            it('returns the apimockId', () =>
                expect(middleware.getApimockIdFromCookie({ cookie: 'a=a;my-identifier=123;c=c' })).toBe('123')));

        describe('apimockId cookie is not present', () =>
            it('returns undefined', () =>
                expect(middleware.getApimockIdFromCookie({ cookie: 'a=a;b=b;c=c' })).toBe(undefined)));
    });
});
