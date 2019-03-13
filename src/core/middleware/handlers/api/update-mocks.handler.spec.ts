import 'reflect-metadata';
import {Container} from 'inversify';

import * as http from 'http';
import {assert, createStubInstance, SinonStub, SinonStubbedInstance, stub} from 'sinon';

import {UpdateMocksHandler} from './update-mocks.handler';
import {State} from '../../../state/state';
import {IState} from '../../../state/Istate';
import {HttpHeaders, HttpMethods, HttpStatusCode} from '../../http';

describe('UpdateMocksHandler', () => {
    let container: Container;
    let handler: UpdateMocksHandler;
    let matchingState: IState;
    let state: SinonStubbedInstance<State>;
    let nextFn: SinonStub;
    let request: SinonStubbedInstance<http.IncomingMessage>;
    let response: SinonStubbedInstance<http.ServerResponse>;

    beforeAll(() => {
        container = new Container();
        state = createStubInstance(State);
        nextFn = stub();
        request = createStubInstance(http.IncomingMessage);
        response = createStubInstance(http.ServerResponse);

        container.bind('BaseUrl').toConstantValue('/base-url');
        container.bind('State').toConstantValue(state);
        container.bind('UpdateMocksHandler').to(UpdateMocksHandler);

        handler = container.get<UpdateMocksHandler>('UpdateMocksHandler');
    });

    describe('handle', () => {
        beforeEach(() => {
            (state as any)._mocks = [];
            state.mocks.push(...[
                {
                    name: 'one',
                    request: {url: '/one', method: 'GET'},
                    responses: {'some': {}, 'thing': {}}
                },
                {
                    name: 'two',
                    delay: 1000,
                    request: {url: '/two', method: 'POST'},
                    responses: {'some': {}, 'thing': {}}
                }
            ]);
            matchingState = {
                mocks: JSON.parse(JSON.stringify({
                    'one': {scenario: 'some', delay: 0, echo: true},
                    'two': {scenario: 'thing', delay: 1000, echo: false}
                })),
                variables: {},
                recordings: {},
                record: false
            };
            state.getMatchingState.returns(matchingState);
        });

        it('sets the echo', () => {
            const body = {name: 'two', echo: true};
            handler.handle(request as any, response, nextFn, {id: 'apimockId', body: body});

            expect(matchingState.mocks[body.name].echo).toBe(true);
            assert.calledWith(response.writeHead, HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            assert.called(response.end);
        });

        it('sets the delay', () => {
            const body = {name: 'two', delay: 2000};
            handler.handle(request as any, response, nextFn, {id: 'apimockId', body: body});

            expect(matchingState.mocks[body.name].delay).toBe(2000);
            assert.calledWith(response.writeHead, HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            assert.called(response.end);
        });

        it('selects a mocks', () => {
            const body = {name: 'two', scenario: 'thing'};
            handler.handle(request as any, response, nextFn, {id: 'apimockId', body: body});

            expect(matchingState.mocks[body.name].scenario).toBe('thing');
            expect(matchingState.mocks[body.name].delay).toBe(1000);
            assert.calledWith(response.writeHead, HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            assert.called(response.end);
        });

        it('selects passThrough', () => {
            const body = {name: 'two', scenario: 'passThrough'};
            handler.handle(request as any, response, nextFn, {id: 'apimockId', body: body});

            expect(matchingState.mocks[body.name].scenario).toBe('passThrough');
            assert.calledWith(response.writeHead, HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            assert.called(response.end);
        });

        it('throw error if scenario does not exist', () => {
            const body = {name: 'two', scenario: 'non-existing'};
            handler.handle(request as any, response, nextFn, {id: 'apimockId', body: body});

            expect(matchingState.mocks[body.name].scenario).toEqual(({
                'one': {scenario: 'some', delay: 0, echo: true},
                'two': {scenario: 'thing', delay: 1000, echo: false}
            } as any)[body.name].scenario);
            assert.calledWith(response.writeHead, HttpStatusCode.CONFLICT, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            assert.calledWith(response.end, `{"message":"No scenario matching ['${body.scenario}'] found"}`);
        });

        it('throw error if mock does not exist', () => {
            const body = {name: 'non-existing', scenario: 'non-existing'};
            handler.handle(request as any, response, nextFn, {id: 'apimockId', body: body});

            assert.calledWith(response.writeHead, HttpStatusCode.CONFLICT, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            assert.calledWith(response.end, `{"message":"No mock matching name ['${body.name}'] found"}`);
        });

        afterEach(() => {
            response.writeHead.reset();
            response.end.reset();
        });
    });

    describe('isApplicable', () => {
        it('indicates applicable when url and action match', () => {
            request.url = `${'/base-url'}/mocks`;
            request.method = HttpMethods.PUT;
            expect(handler.isApplicable(request as any)).toBe(true);
        });
        it('indicates not applicable when the action does not match', () => {
            request.url = `${'/base-url'}/mocks`;
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