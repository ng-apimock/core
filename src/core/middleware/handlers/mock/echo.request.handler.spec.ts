import 'reflect-metadata';
import {Container} from 'inversify';

import * as http from 'http';
import {assert, createStubInstance, SinonStub, SinonStubbedInstance, stub} from 'sinon';

import {EchoRequestHandler} from './echo.request.handler';
import {Mock} from '../../../mock/mock';
import {State} from '../../../state/state';
import {HttpMethods} from '../../http';

describe('EchoRequestHandler', () => {
    let container: Container;
    let consoleLogFn: SinonStub;
    let echoRequestHandler: EchoRequestHandler;
    let state: SinonStubbedInstance<State>;
    let nextFn: SinonStub;
    let request: SinonStubbedInstance<http.IncomingMessage>;
    let response: SinonStubbedInstance<http.ServerResponse>;

    beforeAll(() => {
        consoleLogFn = stub(console, 'log');
        container = new Container();
        state = createStubInstance(State);
        nextFn = stub();
        request = createStubInstance(http.IncomingMessage);
        response = createStubInstance(http.ServerResponse);

        container.bind('EchoRequestHandler').to(EchoRequestHandler);
        container.bind('State').toConstantValue(state);

        echoRequestHandler = container.get<EchoRequestHandler>('EchoRequestHandler');
    });

    describe('handle', () => {
        describe('echo = true', () =>
            it('console.logs the request', () => {
                state.getEcho.returns(true);

                echoRequestHandler.handle(request as any, response, nextFn, {
                    id: 'apimockId', mock: {
                        name: 'some', request: { method: HttpMethods.GET, url: '/some/url' }
                    } as Mock, body: { x: 'x' }
                });
                assert.calledWith(state.getEcho, ({
                    name: 'some', request: { method: HttpMethods.GET, url: '/some/url' }
                } as Mock).name, 'apimockId');
                assert.calledWith(consoleLogFn, `${({
                    name: 'some', request: { method: HttpMethods.GET, url: '/some/url' }
                } as Mock).request.method} request made on \'${({
                    name: 'some', request: { method: HttpMethods.GET, url: '/some/url' }
                } as Mock).request.url}\' with body: \'${JSON.stringify({ x: 'x' })}`);
            })
        );

        describe('echo = false', () =>
            it('does not console.logs the request', () => {
                state.getEcho.returns(false);

                echoRequestHandler.handle(request as any, response, nextFn, {
                    id: 'apimockId', mock: {
                        name: 'some', request: { method: HttpMethods.GET, url: '/some/url' }
                    } as Mock, body: { x: 'x' }
                });
                assert.calledWith(state.getEcho, ({
                    name: 'some', request: { method: HttpMethods.GET, url: '/some/url' }
                } as Mock).name, 'apimockId');
                assert.notCalled(consoleLogFn);
            })
        );

        afterEach(() => {
            state.getEcho.reset();
            nextFn.reset();
            consoleLogFn.reset();
        });
    });

    afterAll(() => {
        consoleLogFn.restore();
    });
});
