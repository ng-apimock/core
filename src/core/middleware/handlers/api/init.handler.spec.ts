import * as http from 'http';
import {Container} from 'inversify';

import {State} from '../../../state/state';
import {HttpHeaders, HttpMethods, HttpStatusCode} from '../../http';

import {InitHandler} from './init.handler';

import {createSpyObj} from 'jest-createspyobj';

describe('InitHandler', () => {
    let container: Container;
    let handler: InitHandler;
    let state: jest.Mocked<State>;

    beforeEach(() => {
        container = new Container();
        state = createSpyObj(State);

        container.bind('BaseUrl').toConstantValue('/base-url');
        container.bind('InitHandler').to(InitHandler);
        container.bind('State').toConstantValue(state);

        handler = container.get<InitHandler>('InitHandler');
    });

    describe('handle', () => {
        let nextFn: jest.Mock<Function>;
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

        it('ends the response', () => {
            handler.handle(request as any, response as any, nextFn, {id: 'apimockId'});

            expect(response.writeHead).toHaveBeenCalledWith(HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            expect(response.end).toHaveBeenCalled;
        });
    });

    describe('isApplicable', () => {
        let request: http.IncomingMessage;

        beforeEach(() => {
            request = {} as http.IncomingMessage;
        });

        it('indicates applicable when url and action match', () => {
            request.url = `${'/base-url'}/init`;
            request.method = HttpMethods.GET;
            expect(handler.isApplicable(request as any)).toBe(true);
        });
        it('indicates not applicable when the action does not match', () => {
            request.url = `${'/base-url'}/init`;
            request.method = HttpMethods.PUT;
            expect(handler.isApplicable(request as any)).toBe(false);
        });
        it('indicates not applicable when the url does not match', () => {
            request.url = `${'/base-url'}/no-match`;
            request.method = HttpMethods.GET;
            expect(handler.isApplicable(request as any)).toBe(false);
        });
    });
});
