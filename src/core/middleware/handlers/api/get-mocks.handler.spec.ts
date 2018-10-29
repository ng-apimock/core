import 'reflect-metadata';
import {Container} from 'inversify';

import * as http from 'http';
import * as sinon from 'sinon';

import GetMocksHandler from './get-mocks.handler';
import State from '../../../state/state';
import Istate from '../../../state/Istate';
import {HttpHeaders, HttpMethods, HttpStatusCode} from '../../http';

describe('GetMocksHandler', () => {
    let container: Container;
    let handler: GetMocksHandler;
    let matchingState: Istate;
    let state: sinon.SinonStubbedInstance<State>;
    let nextFn: sinon.SinonStub;
    let request: sinon.SinonStubbedInstance<http.IncomingMessage>;
    let response: sinon.SinonStubbedInstance<http.ServerResponse>;

    beforeAll(() => {
        container = new Container();
        state = sinon.createStubInstance(State);
        nextFn = sinon.stub();
        request = sinon.createStubInstance(http.IncomingMessage);
        response = sinon.createStubInstance(http.ServerResponse);

        container.bind('BaseUrl').toConstantValue('/base-url');
        container.bind('State').toConstantValue(state);
        container.bind('GetMocksHandler').to(GetMocksHandler);

        handler = container.get<GetMocksHandler>('GetMocksHandler');
    });

    describe('handle', () => {
        beforeEach(() => {
            state.mocks = [
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
                variables: {},
                recordings: {},
                record: false
            };
            state.getMatchingState.returns(matchingState);
        });

        it('gets the mocks', () => {
            handler.handle(request as any, response, nextFn, { id: 'apimockId' });
            sinon.assert.calledWith(response.writeHead, HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            sinon.assert.calledWith(response.end, JSON.stringify({
                state: matchingState.mocks,
                mocks: [{
                    name: state.mocks[0].name,
                    request: state.mocks[0].request,
                    responses: ['some', 'thing'] // all the response identifiers
                }, {
                    name: state.mocks[1].name,
                    request: state.mocks[1].request,
                    responses: ['some', 'thing'] // all the response identifiers
                }]
            }));
        });

        afterEach(() => {
            response.writeHead.reset();
            response.end.reset();
        });
    });

    describe('isApplicable', () => {
        it('indicates applicable when url and method match', () => {
            request.url = `${'/base-url'}/mocks`;
            request.method = HttpMethods.GET;
            expect(handler.isApplicable(request as any)).toBe(true);
        });
        it('indicates not applicable when the method does not match', () => {
            request.url = `${'/base-url'}/mocks`;
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