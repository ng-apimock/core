import 'reflect-metadata';
import {Container} from 'inversify';

import * as http from 'http';
import * as sinon from 'sinon';

import MocksState from '../../../state/mocks.state';
import SetVariableHandler from './set-variable.handler';
import State from '../../../state/state';
import {HttpHeaders, HttpMethods, HttpStatusCode} from '../../http';

describe('SetVariableHandler', () => {
    let container: Container;
    let handler: SetVariableHandler;
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
        container.bind('SetVariableHandler').to(SetVariableHandler);

        handler = container.get<SetVariableHandler>('SetVariableHandler');
    });

    describe('handle', () => {
        beforeEach(() => {
            request.method = HttpMethods.PUT;
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
            mocksState.getMatchingState.returns(matchingState);
        });

        it('sets the variable', () => {
            const body = { 'four': 'fourth' } as any;
            handler.handle(request as any, response, nextFn, { id: 'apimockId', body: body });
            sinon.assert.calledWith(response.writeHead, HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            sinon.assert.called(response.end);
            expect(matchingState.variables['four']).toBe('fourth');
        });

        it('sets the variables', () => {
            const body = { 'five': 'fifth', 'six': 'sixth' } as any;
            handler.handle(request as any, response, nextFn, { id: 'apimockId', body: body });
            sinon.assert.calledWith(response.writeHead, HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            sinon.assert.called(response.end);
            expect(matchingState.variables['five']).toBe('fifth');
            expect(matchingState.variables['six']).toBe('sixth');
        });

        it('throw error if no key value pair is present', () => {
            const body = {} as any;
            handler.handle(request as any, response, nextFn, { id: 'apimockId', body: body });
            sinon.assert.calledWith(response.writeHead, HttpStatusCode.CONFLICT, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            sinon.assert.calledWith(response.end, `{"message":"A variable should have a key and value"}`);
        });

        afterEach(() => {
            mocksState.getMatchingState.reset();
            response.writeHead.reset();
            response.end.reset();
        });
    });

    describe('isApplicable', () => {
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