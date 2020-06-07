import * as http from 'http';
import { Container } from 'inversify';

import { createSpyObj } from 'jest-createspyobj';
import { IState } from '../../../state/Istate';
import { State } from '../../../state/state';
import { HttpHeaders, HttpMethods, HttpStatusCode } from '../../http';

import { SetVariableHandler } from './set-variable.handler';


describe('SetVariableHandler', () => {
    let container: Container;
    let handler: SetVariableHandler;
    let matchingState: IState;
    let state: jest.Mocked<State>;

    beforeEach(() => {
        container = new Container();
        state = createSpyObj(State);

        container.bind('BaseUrl').toConstantValue('/base-url');
        container.bind('SetVariableHandler').to(SetVariableHandler);
        container.bind('State').toConstantValue(state);

        handler = container.get<SetVariableHandler>('SetVariableHandler');
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

            request.method = HttpMethods.PUT;
            matchingState = {
                mocks: {},
                variables: JSON.parse(JSON.stringify({
                    one: 'first', two: 'second', three: 'third'
                })),
                recordings: {},
                record: false
            };
            state.getMatchingState.mockReturnValue(matchingState);
        });

        it('sets the variable', () => {
            const body = { four: 'fourth' } as any;
            handler.handle(request as any, response as any, nextFn, { id: 'apimockId', body });

            expect(response.writeHead).toHaveBeenCalledWith(HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            expect(response.end).toHaveBeenCalled();
            expect(matchingState.variables.four).toBe('fourth');
        });

        it('sets the variables', () => {
            const body = { five: 'fifth', six: 'sixth' } as any;
            handler.handle(request as any, response as any, nextFn, { id: 'apimockId', body });

            expect(response.writeHead).toHaveBeenCalledWith(HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            expect(response.end).toHaveBeenCalled();
            expect(matchingState.variables.five).toBe('fifth');
            expect(matchingState.variables.six).toBe('sixth');
        });

        it('throw error if no key value pair is present', () => {
            const body = {} as any;
            handler.handle(request as any, response as any, nextFn, { id: 'apimockId', body });

            expect(response.writeHead).toHaveBeenCalledWith(HttpStatusCode.CONFLICT, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            expect(response.end).toHaveBeenCalledWith('{"message":"A variable should have a key and value"}');
        });
    });

    describe('isApplicable', () => {
        let request: http.IncomingMessage;

        beforeEach(() => {
            request = {} as http.IncomingMessage;
        });

        it('indicates applicable when url and action match', () => {
            request.url = `${'/base-url'}/variables`;
            request.method = HttpMethods.PUT;
            expect(handler.isApplicable(request as any)).toBe(true);
        });
        it('indicates not applicable when the action does not match', () => {
            request.url = `${'/base-url'}/variables`;
            request.method = HttpMethods.GET;
            expect(handler.isApplicable(request as any)).toBe(false);
        });
        it('indicates not applicable when the url does not match', () => {
            request.url = `${'/base-url'}/no-match`;
            request.method = HttpMethods.PUT;
            expect(handler.isApplicable(request as any)).toBe(false);
        });
    });
});
