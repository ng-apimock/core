import 'reflect-metadata';
import {Container} from 'inversify';

import * as http from 'http';
import * as sinon from 'sinon';

import State from '../../../state/state';
import RecordHandler from './record.handler';
import {HttpHeaders, HttpStatusCode} from '../../http';
import Istate from '../../../state/Istate';

describe('RecordHandler', () => {
    let container: Container;
    let handler: RecordHandler;
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
        container.bind('RecordHandler').to(RecordHandler);

        handler = container.get<RecordHandler>('RecordHandler');
    });

    describe('handle', () => {
        beforeEach(() => {
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

        it('sets the recording indicator', () => {
            handler.handle(request as any, response, nextFn, { id: 'apimockId', body: { record: true } });

            expect(matchingState.record).toBe(true);
            sinon.assert.calledWith(response.writeHead, HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            sinon.assert.called(response.end);
        });
    });

    describe('isApplicable', () => {
        it('indicates applicable when url and action match', () => {
            request.url = `${'/base-url'}/actions`;
            expect(handler.isApplicable(request as any, { action: 'record' })).toBe(true);
        });
        it('indicates not applicable when the action does not match', () => {
            request.url = `${'/base-url'}/actions`;
            expect(handler.isApplicable(request as any, { action: 'NO-MATCHING-ACTION' })).toBe(false);
        });
        it('indicates not applicable when the url does not match', () => {
            request.url = `${'/base-url'}/no-match`;
            expect(handler.isApplicable(request as any, { action: 'record' })).toBe(false);
        });
    });
});