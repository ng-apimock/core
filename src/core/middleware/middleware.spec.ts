import * as http from 'http';

import { Container } from 'inversify';
import { createSpyObj } from 'jest-createspyobj';

import { Configuration, DefaultConfiguration } from '../configuration';
import { IState } from '../state/Istate';
import { State } from '../state/state';

import { AddMockScenarioToPresetHandler } from './handlers/api/add-mockscenario-to-preset.handler';
import { CreateMockHandler } from './handlers/api/create-mock.handler';
import { CreatePresetHandler } from './handlers/api/create-preset.handler';
import { DefaultsHandler } from './handlers/api/defaults.handler';
import { DeleteVariableHandler } from './handlers/api/delete-variable.handler';
import { GetMocksHandler } from './handlers/api/get-mocks.handler';
import { GetPresetsHandler } from './handlers/api/get-presets.handler';
import { GetRecordedResponseHandler } from './handlers/api/get-recorded-response.handler';
import { GetRecordingsHandler } from './handlers/api/get-recordings.handler';
import { GetVariablesHandler } from './handlers/api/get-variables.handler';
import { InitHandler } from './handlers/api/init.handler';
import { PassThroughsHandler } from './handlers/api/pass-throughs.handler';
import { RecordHandler } from './handlers/api/record.handler';
import { SelectPresetHandler } from './handlers/api/select-preset.handler';
import { SetVariableHandler } from './handlers/api/set-variable.handler';
import { UpdateMocksHandler } from './handlers/api/update-mocks.handler';
import { ApplicableHandler } from './handlers/handler';
import { EchoRequestHandler } from './handlers/mock/echo.request.handler';
import { MockRequestHandler } from './handlers/mock/mock.request.handler';
import { RecordResponseHandler } from './handlers/mock/record.response.handler';
import { HttpMethods } from './http';
import { Middleware } from './middleware';

describe('Middleware', () => {
    let container: Container;
    let defaultsHandler: DefaultsHandler;
    let deleteVariableHandler: DeleteVariableHandler;
    let echoRequestHandler: EchoRequestHandler;
    let getMocksHandler: GetMocksHandler;
    let getPresetsHandler: GetPresetsHandler;
    let getVariablesHandler: jest.Mocked<GetVariablesHandler>;
    let getRecordingsHandler: GetRecordingsHandler;
    let initHandler: InitHandler;
    let middleware: Middleware;
    let mockRequestHandler: MockRequestHandler;
    let state: jest.Mocked<State>;
    let passThroughsHandler: PassThroughsHandler;
    let recordResponseHandler: RecordResponseHandler;
    let recordHandler: RecordHandler;
    let getRecordedResponseHandler: GetRecordedResponseHandler;
    let jsonBodyParser: jest.Mock;
    let setVariableHandler: SetVariableHandler;
    let selectPresetHandler: SelectPresetHandler;
    let updateMocksHandler: UpdateMocksHandler;
    let createMockHandler: CreateMockHandler;
    let createPresetHandler: CreatePresetHandler;
    let addMockToPresetHandler: AddMockScenarioToPresetHandler;

    beforeEach(() => {
        container = new Container();
        defaultsHandler = createSpyObj(DefaultsHandler);
        deleteVariableHandler = createSpyObj(DeleteVariableHandler);
        echoRequestHandler = createSpyObj(EchoRequestHandler);
        getMocksHandler = createSpyObj(GetMocksHandler);
        getPresetsHandler = createSpyObj(GetPresetsHandler);
        getRecordingsHandler = createSpyObj(GetRecordingsHandler);
        getRecordedResponseHandler = createSpyObj(GetRecordedResponseHandler);
        getVariablesHandler = createSpyObj(GetVariablesHandler);
        initHandler = createSpyObj(InitHandler);
        jsonBodyParser = jest.fn();
        mockRequestHandler = createSpyObj(MockRequestHandler);
        passThroughsHandler = createSpyObj(PassThroughsHandler);
        recordHandler = createSpyObj(RecordHandler);
        recordResponseHandler = createSpyObj(RecordResponseHandler);
        selectPresetHandler = createSpyObj(SelectPresetHandler);
        setVariableHandler = createSpyObj(SetVariableHandler);
        state = createSpyObj(State);
        updateMocksHandler = createSpyObj(UpdateMocksHandler);
        createMockHandler = createSpyObj(CreateMockHandler);
        createPresetHandler = createSpyObj(CreatePresetHandler);
        addMockToPresetHandler = createSpyObj(AddMockScenarioToPresetHandler);

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
        container.bind('CreateMockHandler').toConstantValue(createMockHandler);
        container.bind('CreatePresetHandler').toConstantValue(createPresetHandler);
        container.bind('AddMockScenarioToPresetHandler').toConstantValue(addMockToPresetHandler);

        middleware = container.get<Middleware>('Middleware');
    });

    describe('middleware', () => {
        let applicableHandler: ApplicableHandler;
        let applicableHandlerHandleFn: jest.Mock;
        let applicableHandlerIsApplicableFn: jest.Mock;
        let getApimockIdFn: jest.SpyInstance<string>;
        let getMatchingApplicableHandlerFn: jest.SpyInstance<ApplicableHandler>;
        let matchingState: IState;
        let nextFn: jest.Mock;
        let request: http.IncomingMessage;
        let response: http.ServerResponse;

        beforeEach(() => {
            applicableHandlerHandleFn = jest.fn();
            applicableHandlerIsApplicableFn = jest.fn();
            applicableHandler = {
                handle: applicableHandlerHandleFn,
                isApplicable: applicableHandlerIsApplicableFn
            };
            nextFn = jest.fn();
            request = {} as http.IncomingMessage;
            response = {} as http.ServerResponse;

            getApimockIdFn = jest.spyOn(middleware, 'getApimockId');
            getMatchingApplicableHandlerFn = jest.spyOn(middleware, 'getMatchingApplicableHandler');

            getApimockIdFn.mockReturnValue('apimockId');
        });

        describe('matching applicable handler', () => {
            beforeEach(() => {
                getMatchingApplicableHandlerFn.mockReturnValue(applicableHandler);
                request.headers = { some: 'header' };
                (request as any).body = { x: 'x' };

                middleware.middleware(request, response, nextFn);

                jsonBodyParser.mock.calls[0][2]();
            });

            it('gets the apimock id', () => expect(getApimockIdFn).toHaveBeenCalled());

            it('gets the matching applicable handler',
                () => expect(getMatchingApplicableHandlerFn).toHaveBeenCalledWith(request, { x: 'x' }));

            it('calls the handler.handle', () => expect(applicableHandlerHandleFn).toHaveBeenCalledWith(request, response, nextFn, {
                id: 'apimockId', body: { x: 'x' }
            }));
        });

        describe('matching mock', () => {
            describe('always', () => {
                beforeEach(() => {
                    getMatchingApplicableHandlerFn.mockReturnValue(undefined);
                    state.getMatchingMock.mockReturnValue({
                        name: 'matching-mock',
                        isArray: true,
                        request: { url: '/base-path', method: HttpMethods.GET },
                        responses: {}
                    });
                    matchingState = {
                        mocks: {},
                        variables: {},
                        recordings: {},
                        record: false
                    };
                    state.getMatchingState.mockReturnValue(matchingState);
                    request.url = '/base-path';
                    request.method = HttpMethods.GET;
                    request.headers = { some: 'header' };
                    (request as any).body = { x: 'x' };

                    middleware.middleware(request, response, nextFn);

                    jsonBodyParser.mock.calls[0][2]();
                });

                it('gets the apimock id', () => expect(getApimockIdFn).toHaveBeenCalled());

                it('gets the matching applicable handler',
                    () => expect(getMatchingApplicableHandlerFn).toHaveBeenCalledWith(request, { x: 'x' }));

                it('gets the matching mock', () => expect(state.getMatchingMock).toHaveBeenCalledWith('/base-path', HttpMethods.GET, {
                    some: 'header'
                }, { x: 'x' }));

                it('calls the echo request handler',
                    () => expect(echoRequestHandler.handle).toHaveBeenCalledWith(request, response, nextFn, {
                        id: 'apimockId',
                        mock: {
                            name: 'matching-mock',
                            isArray: true,
                            request: { url: '/base-path', method: HttpMethods.GET },
                            responses: {}
                        },
                        body: { x: 'x' }
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
                    state.getMatchingState.mockReturnValue(matchingState);
                    getApimockIdFn.mockReturnValue('apimockId');
                    getMatchingApplicableHandlerFn.mockReturnValue(undefined);
                    state.getMatchingMock.mockReturnValue({
                        name: 'matching-mock',
                        isArray: true,
                        request: { url: '/base-path', method: HttpMethods.GET },
                        responses: {}
                    });
                    request.url = '/base-path';
                    request.method = HttpMethods.GET;
                    request.headers = { some: 'header' };
                    (request as any).body = { x: 'x' };
                });

                describe('record header is present', () => {
                    beforeEach(() => {
                        request.headers.record = 'true';
                        middleware.middleware(request, response, nextFn);

                        jsonBodyParser.mock.calls[0][2]();
                    });

                    it('does not call the record response handler', () => expect(recordResponseHandler.handle).not.toHaveBeenCalled());
                });

                describe('record header is not present', () => {
                    beforeEach(() => {
                        request.headers.record = undefined;
                        middleware.middleware(request, response, nextFn);

                        jsonBodyParser.mock.calls[0][2]();
                    });

                    it('calls the record response handler',
                        () => expect(recordResponseHandler.handle).toHaveBeenCalledWith(request, response, nextFn, {
                            id: 'apimockId',
                            mock: {
                                name: 'matching-mock',
                                isArray: true,
                                request: { url: '/base-path', method: HttpMethods.GET },
                                responses: {}
                            },
                            body: { x: 'x' }
                        }));
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
                    state.getMatchingState.mockReturnValue(matchingState);
                    getApimockIdFn.mockReturnValue('apimockId');
                    getMatchingApplicableHandlerFn.mockReturnValue(undefined);
                    state.getMatchingMock.mockReturnValue({
                        name: 'matching-mock',
                        isArray: true,
                        request: { url: '/base-path', method: HttpMethods.GET },
                        responses: {}
                    });
                    request.url = '/base-path';
                    request.method = HttpMethods.GET;
                    request.headers = { some: 'header' };
                    (request as any).body = { x: 'x' };

                    middleware.middleware(request, response, nextFn);

                    jsonBodyParser.mock.calls[0][2]();
                });

                it('calls the mock request handler', () => expect(mockRequestHandler.handle).toHaveBeenCalledWith(request,
                    response, nextFn, {
                        id: 'apimockId',
                        mock: {
                            name: 'matching-mock',
                            isArray: true,
                            request: { url: '/base-path', method: HttpMethods.GET },
                            responses: {}
                        }
                    }));
            });
        });

        describe('no matching mock', () => {
            beforeEach(() => {
                getApimockIdFn.mockReturnValue('apimockId');
                getMatchingApplicableHandlerFn.mockReturnValue(undefined);
                state.getMatchingMock.mockReturnValue(undefined);
                request.headers = { some: 'header' };
                (request as any).body = { x: 'x' };

                middleware.middleware(request, response, nextFn);

                jsonBodyParser.mock.calls[0][2]();
            });

            it('calls next', () => expect(nextFn).toHaveBeenCalled());
        });
    });

    describe('getMatchingApplicableHandler', () => {
        let request: http.IncomingMessage;

        beforeEach(() => {
            request = {} as http.IncomingMessage;

            getVariablesHandler.isApplicable.mockReturnValue(true);
        });

        it('finds the applicable handler',
            () => expect(middleware.getMatchingApplicableHandler(request, { x: 'x' })).toEqual(getVariablesHandler));
    });

    describe('getApimockId', () => {
        let getApimockIdFromHeaderFn: jest.Mocked<any>;
        let getApimockIdFromCookieFn: jest.Mocked<any>;

        beforeEach(() => {
            getApimockIdFromCookieFn = jest.spyOn(middleware, 'getApimockIdFromCookie');
            getApimockIdFromHeaderFn = jest.spyOn(middleware, 'getApimockIdFromHeader');
        });

        describe('configuration use cookie', () => {
            beforeEach(() => {
                middleware['configuration'].middleware.useHeader = false;
                middleware.getApimockId({ some: 'header' });
            });

            it('returns the apimockId from the cookie', () => expect(getApimockIdFromCookieFn).toHaveBeenCalledWith({ some: 'header' }));
        });

        describe('configuration use header', () => {
            beforeEach(() => {
                middleware['configuration'].middleware.useHeader = true;
                middleware.getApimockId({ some: 'header' });
            });

            it('returns the apimockId from the header', () => expect(getApimockIdFromHeaderFn).toHaveBeenCalledWith({ some: 'header' }));
        });
    });

    describe('getApimockIdFromHeader', () => {
        beforeEach(() => {
            middleware['configuration'].middleware.identifier = 'my-identifier';
        });
        describe('apimockId header is present', () => {
            it('returns the identifier', () => expect(middleware.getApimockIdFromHeader({
                a: 'a',
                'my-identifier': '123',
                c: 'c'
            })).toBe('123'));
        });

        describe('apimockId header is not present', () => {
            it('returns undefined', () => expect(middleware.getApimockIdFromHeader({
                a: 'a',
                'no-matching-identifier': '123',
                c: 'c'
            })).toBe(undefined));
        });
    });

    describe('getApimockIdFromCookie', () => {
        beforeEach(() => {
            middleware['configuration'].middleware.identifier = 'my-identifier';
        });
        describe('apimockId cookie is present', () => {
            it('returns the apimockId',
                () => expect(middleware.getApimockIdFromCookie({ cookie: 'a=a;my-identifier=123;c=c' })).toBe('123'));
        });

        describe('apimockId cookie is not present', () => {
            it('returns undefined', () => expect(middleware.getApimockIdFromCookie({ cookie: 'a=a;b=b;c=c' })).toBe(undefined));
        });
    });
});
