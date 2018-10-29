import 'reflect-metadata';
import {Container} from 'inversify';

import * as http from 'http';
import * as sinon from 'sinon';

import GetVariablesHandler from './get-variables.handler';
import State from '../../../state/state';
import Istate from '../../../state/Istate';
import {HttpHeaders, HttpMethods, HttpStatusCode} from '../../http';

describe('GetVariablesHandler', () => {
    let container: Container;
    let handler: GetVariablesHandler;
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
        container.bind('GetVariablesHandler').to(GetVariablesHandler);

        handler = container.get<GetVariablesHandler>('GetVariablesHandler');
    });

    describe('handle', () => {
        beforeEach(() => {
            request.url = `${'/base-url'}/variables`;
            matchingState = {
                mocks: {},
                variables: JSON.parse(JSON.stringify({
                    'one': 'first',
                    'two': 'second',
                    'three': 'third'
                })),
                recordings: {},
                record: false
            };
            state.getMatchingState.returns(matchingState);
        });

        it('gets the variables', () => {
            handler.handle(request as any, response, nextFn, { id: 'apimockId' });
            sinon.assert.calledWith(response.writeHead, HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            sinon.assert.called(response.end);
            expect(Object.keys(matchingState.variables).length).toBe(3);
        });

        afterEach(() => {
            response.writeHead.reset();
            response.end.reset();
        });
    });

    describe('isApplicable', () => {
        it('indicates applicable when url and method match', () => {
            request.url = `${'/base-url'}/variables`;
            request.method = HttpMethods.GET;
            expect(handler.isApplicable(request as any)).toBe(true);
        });
        it('indicates not applicable when the method does not match', () => {
            request.url = `${'/base-url'}/variables`;
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