import 'reflect-metadata';
import {Container} from 'inversify';

import * as http from 'http';
import * as sinon from 'sinon';

import GetPresetsHandler from './get-presets.handler';
import State from '../../../state/state';
import {HttpHeaders, HttpMethods, HttpStatusCode} from '../../http';

describe('GetPresetsHandler', () => {
    let container: Container;
    let handler: GetPresetsHandler;
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
        container.bind('GetPresetsHandler').to(GetPresetsHandler);

        handler = container.get<GetPresetsHandler>('GetPresetsHandler');
    });

    describe('handle', () => {
        beforeEach(() => {
            state.presets = [{
                name: 'one',
                mocks: {
                    'some': {
                        scenario: 'success',
                        delay: 2000,
                        echo: true
                    },
                    'another': {
                        scenario: 'failure'
                    }
                },
                variables: {
                    'today': 'some date'
                }
            }];
        });

        it('gets the presets', () => {
            handler.handle(request as any, response, nextFn);
            sinon.assert.calledWith(response.writeHead, HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            sinon.assert.calledWith(response.end, JSON.stringify({
                presets: [{
                    name: 'one',
                    mocks: {
                        'some': {
                            scenario: 'success',
                            delay: 2000,
                            echo: true
                        },
                        'another': {
                            scenario: 'failure'
                        }
                    },
                    variables: {
                        'today': 'some date'
                    }
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
            request.url = `${'/base-url'}/presets`;
            request.method = HttpMethods.GET;
            expect(handler.isApplicable(request as any)).toBe(true);
        });
        it('indicates not applicable when the method does not match', () => {
            request.url = `${'/base-url'}/presets`;
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