import * as http from 'http';
import {assert, createStubInstance, SinonStub, SinonStubbedInstance, stub} from 'sinon';
import {Container} from 'inversify';
import {DefaultsHandler} from './defaults.handler';
import {HttpHeaders, HttpStatusCode} from '../../http';
import {State} from '../../../state/state';

describe('DefaultsHandler', () => {
    let container: Container;
    let handler: DefaultsHandler;
    let state: SinonStubbedInstance<State>;

    beforeEach(() => {
        container = new Container();
        state = createStubInstance(State);

        container.bind('ActionHandler').to(DefaultsHandler);
        container.bind('BaseUrl').toConstantValue('/base-url');
        container.bind('State').toConstantValue(state);

        handler = container.get<DefaultsHandler>('ActionHandler');
    });

    describe('handle', () => {
        let nextFn: SinonStub;
        let request: SinonStubbedInstance<http.IncomingMessage>;
        let response: SinonStubbedInstance<http.ServerResponse>;

        beforeEach(() => {
            nextFn = stub();
            request = createStubInstance(http.IncomingMessage);
            response = createStubInstance(http.ServerResponse);
        });

        it('sets the defaults', () => {
            handler.handle(request as any, response as any, nextFn, {id: 'apimockId'});

            assert.calledWith(state.setToDefaults, 'apimockId');
            assert.calledWith(response.writeHead, HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            assert.called(response.end);
        });
    });

    describe('isApplicable', () => {
        let request: SinonStubbedInstance<http.IncomingMessage>;

        beforeEach(() => {
            request = createStubInstance(http.IncomingMessage);
        });

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
