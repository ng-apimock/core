import * as http from 'http';
import {assert, createStubInstance, SinonStub, SinonStubbedInstance, stub} from 'sinon';
import {Container} from 'inversify';
import {EchoRequestHandler} from './echo.request.handler';
import {HttpMethods} from '../../http';
import {Mock} from '../../../mock/mock';
import {State} from '../../../state/state';

describe('EchoRequestHandler', () => {
    let container: Container;
    let consoleLogFn: SinonStub;
    let echoRequestHandler: EchoRequestHandler;
    let state: SinonStubbedInstance<State>;

    beforeEach(() => {
        container = new Container();
        state = createStubInstance(State);

        container.bind('EchoRequestHandler').to(EchoRequestHandler);
        container.bind('State').toConstantValue(state);

        echoRequestHandler = container.get<EchoRequestHandler>('EchoRequestHandler');
    });

    afterEach(() => {
        consoleLogFn.restore();
    });

    describe('handle', () => {
        let nextFn: SinonStub;
        let request: SinonStubbedInstance<http.IncomingMessage>;
        let response: SinonStubbedInstance<http.ServerResponse>;

        beforeEach(() => {
            consoleLogFn = stub(console, 'log');
            nextFn = stub();
            request = createStubInstance(http.IncomingMessage);
            response = createStubInstance(http.ServerResponse);
        });

        afterEach(() => {
            state.getEcho.reset();
            nextFn.reset();
            consoleLogFn.reset();
        });

        describe('echo = true', () => {
            beforeEach(() => {
                state.getEcho.returns(true);
            });

            it('console.logs the request', () => {
                echoRequestHandler.handle(request as any, response as any, nextFn, {
                    id: 'apimockId', mock: {
                        name: 'some', request: {method: HttpMethods.GET, url: '/some/url'}
                    } as Mock, body: {x: 'x'}
                });

                assert.calledWith(state.getEcho, ({
                    name: 'some', request: {method: HttpMethods.GET, url: '/some/url'}
                } as Mock).name, 'apimockId');
                assert.calledWith(consoleLogFn, `${({
                    name: 'some', request: {method: HttpMethods.GET, url: '/some/url'}
                } as Mock).request.method} request made on \'${({
                    name: 'some', request: {method: HttpMethods.GET, url: '/some/url'}
                } as Mock).request.url}\' with body: \'${JSON.stringify({x: 'x'})}`);
            });
        });

        describe('echo = false', () => {
            beforeEach(() => {
                state.getEcho.returns(false);
            });

            it('does not console.logs the request', () => {
                echoRequestHandler.handle(request as any, response as any, nextFn, {
                    id: 'apimockId', mock: {
                        name: 'some', request: {method: HttpMethods.GET, url: '/some/url'}
                    } as Mock, body: {x: 'x'}
                });

                assert.calledWith(state.getEcho, ({
                    name: 'some', request: {method: HttpMethods.GET, url: '/some/url'}
                } as Mock).name, 'apimockId');
                assert.notCalled(consoleLogFn);
            });
        });
    });
});
