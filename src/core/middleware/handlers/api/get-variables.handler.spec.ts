import * as http from 'http';

import * as debug from 'debug';
import { Container } from 'inversify';
import { createSpyObj } from 'jest-createspyobj';

import { IState } from '../../../state/Istate';
import { State } from '../../../state/state';
import { HttpHeaders, HttpMethods, HttpStatusCode } from '../../http';

import { GetVariablesHandler } from './get-variables.handler';

describe('GetVariablesHandler', () => {
    let container: Container;
    let handler: GetVariablesHandler;
    let matchingState: IState;
    let state: jest.Mocked<State>;

    beforeEach(() => {
        container = new Container();
        state = createSpyObj(State);

        container.bind('Configuration').toConstantValue({ middleware: { basePath: '/base-path' } });
        container.bind('GetVariablesHandler').to(GetVariablesHandler);
        container.bind('State').toConstantValue(state);

        handler = container.get<GetVariablesHandler>('GetVariablesHandler');
    });

    describe('handle', () => {
        let debugFn: jest.SpyInstance;
        let nextFn: jest.Mock;
        let request: http.IncomingMessage;
        let response: http.ServerResponse;

        beforeEach(() => {
            debug.enable('ng-apimock:handler-get-variables');
            debugFn = jest.spyOn(process.stderr, 'write');

            nextFn = jest.fn();
            request = {} as http.IncomingMessage;
            response = {
                end: jest.fn(),
                writeHead: jest.fn()
            } as unknown as http.ServerResponse;

            request.url = '/base-path/variables';
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

        it('gets the variables', () => {
            handler.handle(request as any, response as any, nextFn, { id: 'apimockId' });

            expect(debugFn).toHaveBeenCalledTimes(1);
            expect(debugFn).toHaveBeenCalledWith(expect.stringContaining('Get variables'));
            expect(response.writeHead).toHaveBeenCalledWith(HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            expect(response.end).toHaveBeenCalledWith(JSON.stringify({
                state: { one: 'first', two: 'second', three: 'third' }
            }));
        });
    });

    describe('isApplicable', () => {
        let request: http.IncomingMessage;

        beforeEach(() => {
            request = {} as http.IncomingMessage;
        });

        it('indicates applicable when url and method match', () => {
            request.url = '/base-path/variables';
            request.method = HttpMethods.GET;
            expect(handler.isApplicable(request as any)).toBe(true);
        });
        it('indicates not applicable when the method does not match', () => {
            request.url = '/base-path/variables';
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
