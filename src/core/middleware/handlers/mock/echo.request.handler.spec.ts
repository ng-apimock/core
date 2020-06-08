import * as http from 'http';

import { Container } from 'inversify';
import { createSpyObj } from 'jest-createspyobj';

import { Mock } from '../../../mock/mock';
import { State } from '../../../state/state';
import { HttpMethods } from '../../http';

import { EchoRequestHandler } from './echo.request.handler';


describe('EchoRequestHandler', () => {
    let container: Container;
    let echoRequestHandler: EchoRequestHandler;
    let state: jest.Mocked<State>;

    beforeEach(() => {
        container = new Container();
        state = createSpyObj(State);

        container.bind('EchoRequestHandler').to(EchoRequestHandler);
        container.bind('State').toConstantValue(state);

        echoRequestHandler = container.get<EchoRequestHandler>('EchoRequestHandler');
    });

    describe('handle', () => {
        let consoleLogFn: jest.Mock;
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

            consoleLogFn = console.log = jest.fn();
        });

        describe('echo = true', () => {
            beforeEach(() => {
                state.getEcho.mockReturnValue(true);
            });

            it('console.logs the request', () => {
                echoRequestHandler.handle(request as any, response as any, nextFn, {
                    id: 'apimockId',
                    mock: {
                        name: 'some', request: { method: HttpMethods.GET, url: '/some/url' }
                    } as Mock,
                    body: { x: 'x' }
                });

                expect(state.getEcho).toHaveBeenCalledWith('some', 'apimockId');
                expect(consoleLogFn).toHaveBeenCalledWith(`${HttpMethods.GET} request made on '/some/url' with body: '${JSON.stringify({ x: 'x' })}'`);
            });
        });

        describe('echo = false', () => {
            beforeEach(() => {
                state.getEcho.mockReturnValue(false);
            });

            it('does not console.logs the request', () => {
                echoRequestHandler.handle(request as any, response as any, nextFn, {
                    id: 'apimockId',
                    mock: {
                        name: 'some', request: { method: HttpMethods.GET, url: '/some/url' }
                    } as Mock,
                    body: { x: 'x' }
                });

                expect(state.getEcho).toHaveBeenCalledWith('some', 'apimockId');
                expect(consoleLogFn).not.toHaveBeenCalled();
            });
        });
    });
});
