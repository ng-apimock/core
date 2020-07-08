import * as http from 'http';

import { Container } from 'inversify';
import { createSpyObj } from 'jest-createspyobj';

import { IState } from '../../../state/Istate';
import { State } from '../../../state/state';
import { HttpHeaders, HttpMethods, HttpStatusCode } from '../../http';

import { UpdateMocksHandler } from './update-mocks.handler';

describe('UpdateMocksHandler', () => {
    let container: Container;
    let handler: UpdateMocksHandler;
    let matchingState: IState;
    let state: jest.Mocked<State>;

    beforeEach(() => {
        container = new Container();
        state = createSpyObj(State);

        container.bind('Configuration').toConstantValue({ middleware: { basePath: '/base-path' } });
        container.bind('State').toConstantValue(state);
        container.bind('UpdateMocksHandler').to(UpdateMocksHandler);

        handler = container.get<UpdateMocksHandler>('UpdateMocksHandler');
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

            (state as any).mocks = [
                {
                    name: 'one',
                    request: { url: '/one', method: 'GET' },
                    responses: { some: {}, thing: {} }
                },
                {
                    name: 'two',
                    delay: 1000,
                    request: { url: '/two', method: 'POST' },
                    responses: { some: {}, thing: {} }
                }
            ];
            matchingState = {
                mocks: JSON.parse(JSON.stringify({
                    one: { scenario: 'some', delay: 0, echo: true },
                    two: { scenario: 'thing', delay: 1000, echo: false }
                })),
                variables: {},
                recordings: {},
                record: false
            };
            state.getMatchingState.mockReturnValue(matchingState);
        });

        it('sets the echo', () => {
            const body = { name: 'two', echo: true };
            handler.handle(request as any, response as any, nextFn, { id: 'apimockId', body });

            expect(matchingState.mocks[body.name].echo).toBe(true);
            expect(response.writeHead).toHaveBeenCalledWith(HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            expect(response.end).toHaveBeenCalled();
        });

        it('sets the delay', () => {
            const body = { name: 'two', delay: 2000 };
            handler.handle(request as any, response as any, nextFn, { id: 'apimockId', body });

            expect(matchingState.mocks[body.name].delay).toBe(2000);
            expect(response.writeHead).toHaveBeenCalledWith(HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            expect(response.end).toHaveBeenCalled();
        });

        it('selects a mocks', () => {
            const body = { name: 'two', scenario: 'thing' };
            handler.handle(request as any, response as any, nextFn, { id: 'apimockId', body });

            expect(matchingState.mocks[body.name].scenario).toBe('thing');
            expect(matchingState.mocks[body.name].delay).toBe(1000);
            expect(response.writeHead).toHaveBeenCalledWith(HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            expect(response.end).toHaveBeenCalled();
        });

        it('selects passThrough', () => {
            const body = { name: 'two', scenario: 'passThrough' };
            handler.handle(request as any, response as any, nextFn, { id: 'apimockId', body });

            expect(matchingState.mocks[body.name].scenario).toBe('passThrough');
            expect(response.writeHead).toHaveBeenCalledWith(HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            expect(response.end).toHaveBeenCalled();
        });

        it('throw error if scenario does not exist', () => {
            const body = { name: 'two', scenario: 'non-existing' };
            handler.handle(request as any, response as any, nextFn, { id: 'apimockId', body });

            expect(matchingState.mocks[body.name].scenario).toEqual(({
                one: { scenario: 'some', delay: 0, echo: true },
                two: { scenario: 'thing', delay: 1000, echo: false }
            } as any)[body.name].scenario);
            expect(response.writeHead).toHaveBeenCalledWith(HttpStatusCode.CONFLICT, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            expect(response.end).toHaveBeenCalledWith(`{"message":"No scenario matching ['${body.scenario}'] found"}`);
        });

        it('throw error if mock does not exist', () => {
            const body = { name: 'non-existing', scenario: 'non-existing' };
            handler.handle(request as any, response as any, nextFn, { id: 'apimockId', body });

            expect(response.writeHead).toHaveBeenCalledWith(HttpStatusCode.CONFLICT, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            expect(response.end).toHaveBeenCalledWith(`{"message":"No mock matching name ['${body.name}'] found"}`);
        });
    });

    describe('isApplicable', () => {
        let request: http.IncomingMessage;

        beforeEach(() => {
            request = {} as http.IncomingMessage;
        });

        it('indicates applicable when url and action match', () => {
            request.url = '/base-path/mocks';
            request.method = HttpMethods.PUT;
            expect(handler.isApplicable(request as any)).toBe(true);
        });
        it('indicates not applicable when the action does not match', () => {
            request.url = '/base-path/mocks';
            request.method = HttpMethods.GET;
            expect(handler.isApplicable(request as any)).toBe(false);
        });
        it('indicates not applicable when the url does not match', () => {
            request.url = '/base-path/no-match';
            request.method = HttpMethods.PUT;
            expect(handler.isApplicable(request as any)).toBe(false);
        });
    });
});
