import * as http from 'http';
import {assert, createStubInstance, match, SinonStub, SinonStubbedInstance, stub} from 'sinon';
import {Container} from 'inversify';
import {GetMocksHandler} from './get-mocks.handler';
import {HttpHeaders, HttpMethods, HttpStatusCode} from '../../http';
import {IState} from '../../../state/Istate';
import {State} from '../../../state/state';

describe('GetMocksHandler', () => {
    let container: Container;
    let handler: GetMocksHandler;
    let matchingState: IState;
    let state: SinonStubbedInstance<State>;

    beforeEach(() => {
        container = new Container();
        state = createStubInstance(State);

        container.bind('BaseUrl').toConstantValue('/base-url');
        container.bind('GetMocksHandler').to(GetMocksHandler);
        container.bind('State').toConstantValue(state);

        handler = container.get<GetMocksHandler>('GetMocksHandler');
    });

    describe('handle', () => {
        let nextFn: SinonStub;
        let request: SinonStubbedInstance<http.IncomingMessage>;
        let response: SinonStubbedInstance<http.ServerResponse>;

        beforeEach(() => {
            nextFn = stub();
            request = createStubInstance(http.IncomingMessage);
            response = createStubInstance(http.ServerResponse);

            (state as any)._mocks = [];
            state.mocks.push(...[
                {name: 'one', request: {url: '/one', method: 'GET'}, responses: {'some': {}, 'thing': {}}},
                {name: 'two', request: {url: '/two', method: 'POST'}, responses: {'some': {}, 'thing': {}}}
            ]);
            matchingState = {
                mocks: JSON.parse(JSON.stringify({
                    one: {scenario: 'some', delay: 0, echo: true},
                    two: {scenario: 'thing', delay: 1000, echo: false}
                })),
                variables: {},
                recordings: {},
                record: false
            };
            state.getMatchingState.returns(matchingState);
        });

        it('gets the mocks', () => {
            handler.handle(request as any, response as any, nextFn, {id: 'apimockId'});

            assert.calledWith(response.writeHead, HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            // @ts-ignore
            assert.calledWith(response.end, JSON.stringify({
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
    });

    describe('isApplicable', () => {
        let request: SinonStubbedInstance<http.IncomingMessage>;

        beforeEach(() => {
            request = createStubInstance(http.IncomingMessage);
        });

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
