import 'reflect-metadata';
import {Container} from 'inversify';

import * as http from 'http';
import * as sinon from 'sinon';

import MocksState from '../../../state/mocks.state';
import PassThroughsHandler from './pass-throughs.handler';
import {HttpHeaders, HttpStatusCode} from '../../http';

describe('PassThroughsHandler', () => {
    let container: Container;
    let handler: PassThroughsHandler;
    let mocksState: sinon.SinonStubbedInstance<MocksState>;
    let nextFn: sinon.SinonStub;
    let request:  sinon.SinonStubbedInstance<http.IncomingMessage>;
    let response:  sinon.SinonStubbedInstance<http.ServerResponse>;

    beforeAll(() => {
        container = new Container();
        mocksState = sinon.createStubInstance(MocksState);
        nextFn = sinon.stub();
        request = sinon.createStubInstance(http.IncomingMessage);
        response = sinon.createStubInstance(http.ServerResponse);

        container.bind('BaseUrl').toConstantValue('/base-url');
        container.bind('MocksState').toConstantValue(mocksState);
        container.bind('PassThroughsHandler').to(PassThroughsHandler);

        handler = container.get<PassThroughsHandler>('PassThroughsHandler');
    });

    describe('handle', () =>
        it('sets the passThroughs', () => {
            handler.handle(request as any, response, nextFn, {id: 'apimockId'});

            sinon.assert.calledWith(mocksState.setToPassThroughs, 'apimockId');
            sinon.assert.calledWith(response.writeHead, HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            sinon.assert.called(response.end);
        }));

    describe('isApplicable', () => {
        it('indicates applicable when url and action match', () => {
            request.url = `${'/base-url'}/actions`;
            expect(handler.isApplicable(request as any, {action: 'passThroughs'})).toBe(true);
        });
        it('indicates not applicable when the action does not match', () => {
            request.url = `${'/base-url'}/actions`;
            expect(handler.isApplicable(request as any, {action: 'NO-MATCHING-ACTION'})).toBe(false);
        });
        it('indicates not applicable when the url does not match', () => {
            request.url = `${'/base-url'}/no-match`;
            expect(handler.isApplicable(request as any, {action: 'passThroughs'})).toBe(false);
        });
    });
});