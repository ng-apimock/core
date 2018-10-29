import 'reflect-metadata';
import {Container} from 'inversify';

import * as http from 'http';
import * as sinon from 'sinon';

import EchoRequestHandler from './echo.request.handler';
import Mock from '../../../mock/mock';
import State from '../../../state/state';
import {HttpMethods} from '../../http';

describe('EchoRequestHandler', () => {
    let container: Container;
    let consoleLogFn: sinon.SinonStub;
    let echoRequestHandler: EchoRequestHandler;
    let state: sinon.SinonStubbedInstance<State>;
    let nextFn: sinon.SinonStub;
    let request: sinon.SinonStubbedInstance<http.IncomingMessage>;
    let response: sinon.SinonStubbedInstance<http.ServerResponse>;

    beforeAll(() => {
        consoleLogFn = sinon.stub(console, 'log');
        container = new Container();
        state = sinon.createStubInstance(State);
        nextFn = sinon.stub();
        request = sinon.createStubInstance(http.IncomingMessage);
        response = sinon.createStubInstance(http.ServerResponse);

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
                sinon.assert.calledWith(state.getEcho, ({
                    name: 'some', request: { method: HttpMethods.GET, url: '/some/url' }
                } as Mock).name, 'apimockId');
                sinon.assert.calledWith(consoleLogFn, `${({
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
                sinon.assert.calledWith(state.getEcho, ({
                    name: 'some', request: { method: HttpMethods.GET, url: '/some/url' }
                } as Mock).name, 'apimockId');
                sinon.assert.notCalled(consoleLogFn);
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
