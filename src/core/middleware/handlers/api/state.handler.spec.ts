import * as http from 'http';

import * as debug from 'debug';
import { Container } from 'inversify';

import { State } from '../../../state/state';
import { HttpHeaders, HttpMethods, HttpStatusCode } from '../../http';

import { StateHandler } from './state.handler';

describe('StateHandler', () => {
    let container: Container;
    let handler: StateHandler;
    let state: State;

    beforeEach(() => {
        container = new Container();
        state = new State();

        container.bind('Configuration').toConstantValue({ middleware: { basePath: '/base-path' } });
        container.bind('State').toConstantValue(state);
        container.bind('StateHandler').to(StateHandler);

        handler = container.get<StateHandler>('StateHandler');
    });

    describe('handle', () => {
        let debugFn: jest.SpyInstance;
        let nextFn: jest.Mock;
        let request: http.IncomingMessage;
        let response: http.ServerResponse;

        beforeEach(() => {
            debug.enable('ng-apimock:handler-state');
            debugFn = jest.spyOn(process.stderr, 'write');

            nextFn = jest.fn();
            request = {} as http.IncomingMessage;
            response = {
                end: jest.fn(),
                writeHead: jest.fn()
            } as unknown as http.ServerResponse;
        });

        it('gets the state', () => {
            handler.handle(request as any, response as any, nextFn, {
                id: 'apimockId'
            });

            expect(debugFn).toHaveBeenCalledTimes(1);
            expect(debugFn).toHaveBeenCalledWith(expect.stringContaining('State'));
            expect(response.writeHead).toHaveBeenCalledWith(HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            expect(response.end).toHaveBeenCalledWith('{"global":{"_mocks":{},"_variables":{},"_recordings":{},"record":false},"sessions":[]}');
        });
    });

    describe('isApplicable', () => {
        let request: http.IncomingMessage;

        beforeEach(() => {
            request = {} as http.IncomingMessage;
        });

        it('indicates applicable when url and action match', () => {
            request.url = '/base-path/state';
            request.method = HttpMethods.GET;
            expect(handler.isApplicable(request as any)).toBe(true);
        });
        it('indicates not applicable when the action does not match', () => {
            request.url = '/base-path/state';
            request.method = HttpMethods.PUT;
            expect(handler.isApplicable(request as any)).toBe(false);
        });
        it('indicates not applicable when the url does not match', () => {
            request.url = '/base-path/no-match';
            request.method = HttpMethods.GET;
            expect(handler.isApplicable(request as any)).toBe(false);
        });
    });
});
