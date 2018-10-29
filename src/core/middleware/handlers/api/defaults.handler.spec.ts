import 'reflect-metadata';
import {Container} from 'inversify';

import * as http from 'http';
import * as sinon from 'sinon';

import DefaultsHandler from './defaults.handler';
import State from '../../../state/state';
import {HttpHeaders, HttpStatusCode} from '../../http';

describe('DefaultsHandler', () => {
    let container: Container;
    let handler: DefaultsHandler;
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
        response.end = response.end as sinon.SinonStub;

        container.bind('BaseUrl').toConstantValue('/base-url');
        container.bind('State').toConstantValue(state);
        container.bind('ActionHandler').to(DefaultsHandler);

        handler = container.get<DefaultsHandler>('ActionHandler');
    });

    describe('handle', () =>
        it('sets the defaults', () => {
            handler.handle(request as any, response, nextFn, {id: 'apimockId'});

            sinon.assert.calledWith(state.setToDefaults, 'apimockId');
            sinon.assert.calledWith(response.writeHead, HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            sinon.assert.called(response.end);
        }));

    describe('isApplicable', () => {
        it('indicates applicable when url and action match', () => {
            request.url = `${'/base-url'}/actions`;
            expect(handler.isApplicable(request as any, {action: 'defaults'})).toBe(true);
        });
        it('indicates not applicable when the action does not match', () => {
            request.url = `${'/base-url'}/actions`;
            expect(handler.isApplicable(request as any, {action: 'NO-MATCHING-ACTION'})).toBe(false);
        });
        it('indicates not applicable when the url does not match', () => {
            request.url = `${'/base-url'}/no-match`;
            expect(handler.isApplicable(request as any, {action: 'defaults'})).toBe(false);
        });
    });
});