import 'reflect-metadata';
import {Container} from 'inversify';

import * as http from 'http';
import * as sinon from 'sinon';

import GetRecordingsHandler from './get-recordings.handler';
import MocksState from '../../../state/mocks.state';
import State from '../../../state/state';
import {HttpHeaders, HttpMethods, HttpStatusCode} from '../../http';

describe('GetRecordingsHandler', () => {
    let container: Container;
    let handler: GetRecordingsHandler;
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
        container.bind('GetRecordingsHandler').to(GetRecordingsHandler);

        handler = container.get<GetRecordingsHandler>('GetRecordingsHandler');
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
                variables: {},
                recordings: {'some': []},
                record: true
            };
            mocksState.getMatchingState.returns(matchingState);
        });

        it('gets the recordings', () => {
            handler.handle(request as any, response, nextFn, { id: 'apimockId' });
            sinon.assert.calledWith(response.writeHead, HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            sinon.assert.calledWith(response.end, JSON.stringify({
                recordings: {'some': []},
                record: true
            }));
        });

        afterEach(() => {
            response.writeHead.reset();
            response.end.reset();
        });
    });

    describe('isApplicable', () => {
        it('indicates applicable when url and method match', () => {
            request.url = `${'/base-url'}/recordings`;
            request.method = HttpMethods.GET;
            expect(handler.isApplicable(request as any)).toBe(true);
        });
        it('indicates not applicable when the method does not match', () => {
            request.url = `${'/base-url'}/recordings`;
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