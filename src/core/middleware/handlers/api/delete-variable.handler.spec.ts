import * as http from 'http';

import { Container } from 'inversify';
import { createSpyObj } from 'jest-createspyobj';

import { IState } from '../../../state/Istate';
import { State } from '../../../state/state';
import { HttpHeaders, HttpMethods, HttpStatusCode } from '../../http';

import { DeleteVariableHandler } from './delete-variable.handler';

describe('DeleteVariableHandler', () => {
    let container: Container;
    let handler: DeleteVariableHandler;
    let matchingState: IState;
    let state: jest.Mocked<State>;

    beforeEach(() => {
        container = new Container();
        state = createSpyObj(State);

        container.bind('BaseUrl').toConstantValue('/base-url');
        container.bind('DeleteVariableHandler').to(DeleteVariableHandler);
        container.bind('State').toConstantValue(state);

        handler = container.get<DeleteVariableHandler>('DeleteVariableHandler');
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

            request.url = `${'/base-url'}/variables/one`;
            matchingState = {
                mocks: {},
                variables: JSON.parse(JSON.stringify({
                    one: 'first',
                    two: 'second',
                    three: 'third'
                })),
                recordings: {},
                record: false
            };
            state.getMatchingState.mockReturnValue(matchingState);
        });

        it('deletes the variable', () => {
            expect(Object.keys(matchingState.variables).length).toBe(3);

            handler.handle(request as any, response as any, nextFn, { id: 'apimockId' });

            expect(Object.keys(matchingState.variables).length).toBe(2);
            expect(response.writeHead).toHaveBeenCalledWith(HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            expect(response.end).toHaveBeenCalled();
        });
    });

    describe('isApplicable', () => {
        let request: http.IncomingMessage;

        beforeEach(() => {
            request = {} as http.IncomingMessage;
        });

        it('indicates applicable when url and method match', () => {
            request.url = `${'/base-url'}/variables`;
            request.method = HttpMethods.DELETE;
            expect(handler.isApplicable(request as any)).toBe(true);
        });
        it('indicates not applicable when the method does not match', () => {
            request.url = `${'/base-url'}/variables`;
            request.method = HttpMethods.GET;
            expect(handler.isApplicable(request as any)).toBe(false);
        });
        it('indicates not applicable when the url does not match', () => {
            request.url = `${'/base-url'}/no-match`;
            request.method = HttpMethods.DELETE;
            expect(handler.isApplicable(request as any)).toBe(false);
        });
    });
});
