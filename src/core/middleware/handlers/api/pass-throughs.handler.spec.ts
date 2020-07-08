import * as http from 'http';

import { Container } from 'inversify';
import { createSpyObj } from 'jest-createspyobj';

import { State } from '../../../state/state';
import { HttpHeaders, HttpStatusCode } from '../../http';

import { PassThroughsHandler } from './pass-throughs.handler';

describe('PassThroughsHandler', () => {
    let container: Container;
    let handler: PassThroughsHandler;
    let state: jest.Mocked<State>;

    beforeEach(() => {
        container = new Container();
        state = createSpyObj(State);

        container.bind('Configuration').toConstantValue({ middleware: { basePath: '/base-path' } });
        container.bind('PassThroughsHandler').to(PassThroughsHandler);
        container.bind('State').toConstantValue(state);

        handler = container.get<PassThroughsHandler>('PassThroughsHandler');
    });

    describe('handle', () => {
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
        });

        it('sets the passThroughs', () => {
            handler.handle(request as any, response as any, nextFn, { id: 'apimockId' });

            expect(state.setToPassThroughs).toHaveBeenCalledWith('apimockId');
            expect(response.writeHead).toHaveBeenCalledWith(HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            expect(response.end).toHaveBeenCalled();
        });
    });

    describe('isApplicable', () => {
        let request: http.IncomingMessage;

        beforeEach(() => {
            request = {} as http.IncomingMessage;
        });

        it('indicates applicable when url and action match', () => {
            request.url = '/base-path/actions';
            expect(handler.isApplicable(request as any, { action: 'passThroughs' })).toBe(true);
        });
        it('indicates not applicable when the action does not match', () => {
            request.url = '/base-path/actions';
            expect(handler.isApplicable(request as any, { action: 'NO-MATCHING-ACTION' })).toBe(false);
        });
        it('indicates not applicable when the url does not match', () => {
            request.url = '/base-path/no-match';
            expect(handler.isApplicable(request as any, { action: 'passThroughs' })).toBe(false);
        });
    });
});
