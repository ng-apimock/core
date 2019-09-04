import * as http from 'http';
import {assert, createStubInstance, SinonStub, SinonStubbedInstance, stub} from 'sinon';
import {ApplicableHandler} from './handlers/handler';
import {Configuration, DefaultConfiguration} from '../configuration';
import {Container} from 'inversify';
import {DefaultsHandler} from './handlers/api/defaults.handler';
import {DeleteVariableHandler} from './handlers/api/delete-variable.handler';
import {EchoRequestHandler} from './handlers/mock/echo.request.handler';
import {GetMocksHandler} from './handlers/api/get-mocks.handler';
import {GetPresetsHandler} from './handlers/api/get-presets.handler';
import {GetRecordingsHandler} from './handlers/api/get-recordings.handler';
import {GetRecordedResponseHandler} from './handlers/api/get-recorded-response.handler';
import {GetVariablesHandler} from './handlers/api/get-variables.handler';
import {HttpMethods} from './http';
import {InitHandler} from './handlers/api/init.handler';
import {IState} from '../state/Istate';
import {Middleware} from './middleware';
import {MockRequestHandler} from './handlers/mock/mock.request.handler';
import {PassThroughsHandler} from './handlers/api/pass-throughs.handler';
import {RecordHandler} from './handlers/api/record.handler';
import {RecordResponseHandler} from './handlers/mock/record.response.handler';
import {SelectPresetHandler} from './handlers/api/select-preset.handler';
import {SetVariableHandler} from './handlers/api/set-variable.handler';
import {State} from '../state/state';
import {UpdateMocksHandler} from './handlers/api/update-mocks.handler';

describe('Middleware', () => {
    let container: Container;
    let defaultsHandler: SinonStubbedInstance<DefaultsHandler>;
    let deleteVariableHandler: SinonStubbedInstance<DeleteVariableHandler>;
    let echoRequestHandler: SinonStubbedInstance<EchoRequestHandler>;
    let getMocksHandler: SinonStubbedInstance<GetMocksHandler>;
    let getPresetsHandler: SinonStubbedInstance<GetPresetsHandler>;
    let getVariablesHandler: SinonStubbedInstance<GetVariablesHandler>;
    let getRecordingsHandler: SinonStubbedInstance<GetRecordingsHandler>;
    let initHandler: SinonStubbedInstance<InitHandler>;
    let middleware: Middleware;
    let mockRequestHandler: SinonStubbedInstance<MockRequestHandler>;
    let state: SinonStubbedInstance<State>;
    let passThroughsHandler: SinonStubbedInstance<PassThroughsHandler>;
    let recordResponseHandler: SinonStubbedInstance<RecordResponseHandler>;
    let recordHandler: SinonStubbedInstance<RecordHandler>;
    let getRecordedResponseHandler: SinonStubbedInstance<GetRecordedResponseHandler>;
    let jsonBodyParser: SinonStub;
    let setVariableHandler: SinonStubbedInstance<SetVariableHandler>;
    let selectPresetHandler: SinonStubbedInstance<SelectPresetHandler>;
    let updateMocksHandler: SinonStubbedInstance<UpdateMocksHandler>;

    beforeEach(() => {
        container = new Container();
        defaultsHandler = createStubInstance(DefaultsHandler);
        deleteVariableHandler = createStubInstance(DeleteVariableHandler);
        echoRequestHandler = createStubInstance(EchoRequestHandler);
        getMocksHandler = createStubInstance(GetMocksHandler);
        getPresetsHandler = createStubInstance(GetPresetsHandler);
        getRecordingsHandler = createStubInstance(GetRecordingsHandler);
        getRecordedResponseHandler = createStubInstance(GetRecordedResponseHandler);
        getVariablesHandler = createStubInstance(GetVariablesHandler);
        initHandler = createStubInstance(InitHandler);
        jsonBodyParser = stub();
        mockRequestHandler = createStubInstance(MockRequestHandler);
        passThroughsHandler = createStubInstance(PassThroughsHandler);
        recordHandler = createStubInstance(RecordHandler);
        recordResponseHandler = createStubInstance(RecordResponseHandler);
        selectPresetHandler = createStubInstance(SelectPresetHandler);
        setVariableHandler = createStubInstance(SetVariableHandler);
        state = createStubInstance(State);
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

        middleware = container.get<Middleware>('Middleware');
    });

    describe('middleware', () => {
        let applicableHandler: ApplicableHandler;
        let applicableHandlerHandleFn: SinonStub;
        let applicableHandlerIsApplicableFn: SinonStub;
        let getApimockIdFn: SinonStub;
        let getMatchingApplicableHandlerFn: SinonStub;
        let matchingState: IState;
        let nextFn: SinonStub;
        let request: any;
        let response: any;

        beforeEach(() => {
            applicableHandlerHandleFn = stub();
            applicableHandlerIsApplicableFn = stub();
            applicableHandler = {handle: applicableHandlerHandleFn, isApplicable: applicableHandlerIsApplicableFn};
            nextFn = stub();
            request = createStubInstance(http.IncomingMessage);
            response = createStubInstance(http.ServerResponse);

            getApimockIdFn = stub(Middleware.prototype, 'getApimockId');
            getMatchingApplicableHandlerFn = stub(Middleware.prototype, 'getMatchingApplicableHandler');

            getApimockIdFn.returns('apimockId');
        });

        afterEach(() => {
            getApimockIdFn.restore();
            getMatchingApplicableHandlerFn.restore();
        });

        describe('matching applicable handler', () => {
            beforeEach(() => {
                getMatchingApplicableHandlerFn.returns(applicableHandler);
                request.headers = {'some': 'header'};
                request.body = {'x': 'x'};

                middleware.middleware(request, response, nextFn);

                jsonBodyParser.getCall(0).callArg(2);
            });

            afterEach(() => {
                getApimockIdFn.reset();
                getMatchingApplicableHandlerFn.reset();
                jsonBodyParser.reset();
            });

            it('gets the apimock id', () =>
                assert.called(getApimockIdFn));

            it('gets the matching applicable handler', () =>
                assert.calledWith(getMatchingApplicableHandlerFn, request, {x: 'x'}));

            it('calls the handler.handle', () =>
                assert.calledWith(applicableHandlerHandleFn, request, response, nextFn, {
                    id: 'apimockId', body: {x: 'x'}
                }));
        });

        describe('matching mock', () => {
            describe('always', () => {
                beforeEach(() => {
                    getMatchingApplicableHandlerFn.returns(undefined);
                    state.getMatchingMock.returns({
                        name: 'matching-mock', isArray: true,
                        request: {url: '/base-url', method: HttpMethods.GET}, responses: {}
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
                    request.headers = {'some': 'header'};
                    request.body = {'x': 'x'};

                    middleware.middleware(request, response, nextFn);

                    jsonBodyParser.getCall(0).callArg(2);
                });

                afterEach(() => {
                    getApimockIdFn.reset();
                    getMatchingApplicableHandlerFn.reset();
                    jsonBodyParser.reset();
                });

                it('gets the apimock id', () =>
                    assert.called(getApimockIdFn));

                it('gets the matching applicable handler', () =>
                    assert.calledWith(getMatchingApplicableHandlerFn, request, {x: 'x'}));

                it('gets the matching mock', () =>
                    assert.calledWith(state.getMatchingMock, '/base-url', HttpMethods.GET, {
                        'some': 'header'
                    }, {x: 'x'}));

                it('calls the echo request handler', () =>
                    assert.calledWith(echoRequestHandler.handle, request, response, nextFn, {
                        id: 'apimockId',
                        mock: {
                            name: 'matching-mock', isArray: true,
                            request: {url: '/base-url', method: HttpMethods.GET}, responses: {}
                        },
                        body: {x: 'x'}
                    }));
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
                        request: {url: '/base-url', method: HttpMethods.GET}, responses: {}
                    });
                    request.url = '/base-url';
                    request.method = HttpMethods.GET;
                    request.headers = {'some': 'header'};
                    request.body = {'x': 'x'};
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
                                request: {url: '/base-url', method: HttpMethods.GET}, responses: {}
                            },
                            body: {x: 'x'}
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
                        request: {url: '/base-url', method: HttpMethods.GET}, responses: {}
                    });
                    request.url = '/base-url';
                    request.method = HttpMethods.GET;
                    request.headers = {'some': 'header'};
                    request.body = {'x': 'x'};

                    middleware.middleware(request, response, nextFn);

                    jsonBodyParser.getCall(0).callArg(2);
                });

                it('calls the mock request handler', () => assert.calledWith(mockRequestHandler.handle, request,
                    response, nextFn, {
                        id: 'apimockId',
                        mock: {
                            name: 'matching-mock', isArray: true,
                            request: {url: '/base-url', method: HttpMethods.GET}, responses: {}
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
                request.headers = {'some': 'header'};
                request.body = {'x': 'x'};

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
        let request: any;

        beforeEach(() => {
            request = createStubInstance(http.IncomingMessage);

            getVariablesHandler.isApplicable.returns(true);
        });

        afterEach(() => {
            getVariablesHandler.isApplicable.reset();
        });

        it('finds the applicable handler', () =>
            expect(middleware.getMatchingApplicableHandler(request, { x: 'x' })).toEqual(getVariablesHandler));
    });

    describe('getApimockId', () => {
        let getApimockIdFromHeaderFn: SinonStub;
        let getApimockIdFromCookieFn: SinonStub;

        beforeEach(()=> {
            getApimockIdFromCookieFn = stub(Middleware.prototype, 'getApimockIdFromCookie');
            getApimockIdFromHeaderFn = stub(Middleware.prototype, 'getApimockIdFromHeader');
        });

        afterEach(() => {
            getApimockIdFromHeaderFn.restore();
            getApimockIdFromCookieFn.restore();
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
        });
        describe('apimockId cookie is present', () =>
            it('returns the apimockId', () =>
                expect(middleware.getApimockIdFromCookie({ cookie: 'a=a;my-identifier=123;c=c' })).toBe('123')));

        describe('apimockId cookie is not present', () =>
            it('returns undefined', () =>
                expect(middleware.getApimockIdFromCookie({ cookie: 'a=a;b=b;c=c' })).toBe(undefined)));
    });
});
