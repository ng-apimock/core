import 'reflect-metadata';
import {Container} from 'inversify';

import * as http from 'http';
import * as sinon from 'sinon';

import UpdateMocksHandler from './update-mocks.handler';
import MocksState from '../../../state/mocks.state';
import State from '../../../state/state';
import {HttpHeaders, HttpMethods, HttpStatusCode} from '../../http';

describe('UpdateMocksHandler', () => {
    let container: Container;
    let handler: UpdateMocksHandler;
    let matchingState: State;
    let mocksState: sinon.SinonStubbedInstance<MocksState>;
    let nextFn: sinon.SinonStub;
    let request: sinon.SinonStubbedInstance<http.IncomingMessage>;
    let response: sinon.SinonStubbedInstance<http.ServerResponse>;

    beforeAll(() => {
        container = new Container();
        mocksState = sinon.createStubInstance(MocksState);
        nextFn = sinon.stub();
        request = sinon.createStubInstance(http.IncomingMessage);
        response = sinon.createStubInstance(http.ServerResponse);

        container.bind('BaseUrl').toConstantValue('/base-url');
        container.bind('MocksState').toConstantValue(mocksState);
        container.bind('UpdateMocksHandler').to(UpdateMocksHandler);

        handler = container.get<UpdateMocksHandler>('UpdateMocksHandler');
    });

    describe('handle', () => {
        beforeEach(() => {
            mocksState.mocks = [
                {
                    name: 'one',
                    request: { url: '/one', method: 'GET' },
                    responses: { 'some': {}, 'thing': {} }
                },
                {
                    name: 'two',
                    request: { url: '/two', method: 'POST' },
                    responses: { 'some': {}, 'thing': {} }
                }
            ];
            matchingState = {
                mocks: JSON.parse(JSON.stringify({
                    'one': { scenario: 'some', delay: 0, echo: true },
                    'two': { scenario: 'thing', delay: 1000, echo: false }
                })),
                variables: {}
            };
            mocksState.getMatchingState.returns(matchingState);
        });

        it('sets the echo', () => {
            const body = { name: 'two', echo: true };
            handler.handle(request as any, response, nextFn, { id: 'apimockId', body: body });

            expect(matchingState.mocks[body.name].echo).toBe(body.echo);
            sinon.assert.calledWith(response.writeHead, HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            sinon.assert.called(response.end);
        });

        it('sets the delay', () => {
            const body = { name: 'two', delay: 1000 };
            handler.handle(request as any, response, nextFn, { id: 'apimockId', body: body });

            expect(matchingState.mocks[body.name].delay).toBe(body.delay);
            sinon.assert.calledWith(response.writeHead, HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            sinon.assert.called(response.end);
        });

        it('selects a mocks', () => {
            const body = { name: 'two', scenario: 'thing' };
            handler.handle(request as any, response, nextFn, { id: 'apimockId', body: body });

            expect(matchingState.mocks[body.name].scenario).toBe(body.scenario);
            sinon.assert.calledWith(response.writeHead, HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            sinon.assert.called(response.end);
        });

        it('selects passThrough', () => {
            const body = { name: 'two', scenario: 'passThrough' };
            handler.handle(request as any, response, nextFn, { id: 'apimockId', body: body });

            expect(matchingState.mocks[body.name].scenario).toBe(body.scenario);
            sinon.assert.calledWith(response.writeHead, HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            sinon.assert.called(response.end);
        });


        it('throw error if scenario does not exist', () => {
            const body = { name: 'two', scenario: 'non-existing' };
            handler.handle(request as any, response, nextFn, { id: 'apimockId', body: body });

            expect(matchingState.mocks[body.name].scenario).toBe(({
                'one': { scenario: 'some', delay: 0, echo: true },
                'two': { scenario: 'thing', delay: 1000, echo: false }
            } as any)[body.name].scenario);
            sinon.assert.calledWith(response.writeHead, HttpStatusCode.CONFLICT, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            sinon.assert.calledWith(response.end, `{"message":"No scenario matching ['${body.scenario}'] found"}`);
        });

        it('throw error if mock does not exist', () => {
            const body = { name: 'non-existing', scenario: 'non-existing' };
            handler.handle(request as any, response, nextFn, { id: 'apimockId', body: body });

            sinon.assert.calledWith(response.writeHead, HttpStatusCode.CONFLICT, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            sinon.assert.calledWith(response.end, `{"message":"No mock matching name ['${body.name}'] found"}`);
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