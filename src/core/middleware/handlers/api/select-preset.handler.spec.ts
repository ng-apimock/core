import 'reflect-metadata';
import {Container} from 'inversify';

import * as http from 'http';
import * as sinon from 'sinon';

import SelectPresetHandler from './select-preset.handler';
import State from '../../../state/state';
import Istate from '../../../state/Istate';
import {HttpHeaders, HttpMethods, HttpStatusCode} from '../../http';

describe('SelectPresetHandler', () => {
    let container: Container;
    let handler: SelectPresetHandler;
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
        container.bind('SelectPresetHandler').to(SelectPresetHandler);

        handler = container.get<SelectPresetHandler>('SelectPresetHandler');
    });

    describe('handle', () => {
        beforeEach(() => {
            state.mocks = [
                {
                    name: 'some',
                    request: { url: '/one', method: 'GET' },
                    responses: { 'success': {}, 'failure': {} }
                },
                {
                    name: 'another',
                    delay: 1000,
                    request: { url: '/two', method: 'POST' },
                    responses: { 'success': {}, 'failure': {} }
                }
            ];
            state.presets = [{
                name: 'valid',
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
            }, {
                name: 'invalid',
                mocks: {
                    'some': {
                        scenario: 'success',
                        delay: 2000,
                        echo: true
                    },
                    'another': {
                        scenario: 'no-match'
                    }
                },
                variables: {
                    'today': 'some date'
                }
            }];
            matchingState = {
                mocks: JSON.parse(JSON.stringify({
                    'some': { scenario: 'failure', delay: 0, echo: true },
                    'another': { scenario: 'success', delay: 1000, echo: false }
                })),
                variables: {},
                recordings: {},
                record: false
            };
            state.getMatchingState.returns(matchingState);
        });

        describe('valid preset data', () => {
            beforeEach(() => {
                const body = { name: 'valid' };
                handler.handle(request as any, response, nextFn, { id: 'apimockId', body: body });
            });

            it('sets the mocks', () => {
                expect(matchingState.mocks['some'].scenario).toBe('success');
                expect(matchingState.mocks['some'].delay).toBe(2000);
                expect(matchingState.mocks['some'].echo).toBe(true);
                expect(matchingState.mocks['another'].scenario).toBe('failure');
                expect(matchingState.mocks['another'].delay).toBe(0); // defaults
                expect(matchingState.mocks['another'].echo).toBe(false); // defaults

                sinon.assert.calledWith(response.writeHead, HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
                sinon.assert.called(response.end);
            });

            it('sets the variables', () => {
                expect(matchingState.variables['today']).toBe('some date');

                sinon.assert.calledWith(response.writeHead, HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
                sinon.assert.called(response.end);
            });
        });

        describe('invalid preset data', () => {
            beforeEach(() => {
                const body = { name: 'invalid' };
                handler.handle(request as any, response, nextFn, { id: 'apimockId', body: body });
            });

            it('throws an error when the scenario does not match', () => {
                sinon.assert.calledWith(response.writeHead, HttpStatusCode.INTERNAL_SERVER_ERROR, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
                sinon.assert.calledWith(response.end, JSON.stringify({ message: 'No scenario matching [\'no-match\'] found' }));
            });
        });

        describe('no matching preset', () => {
            beforeEach(() => {
                const body = { name: 'no-match' };
                handler.handle(request as any, response, nextFn, { id: 'apimockId', body: body });
            });

            it('throws an error when the preset does not match', () => {
                sinon.assert.calledWith(response.writeHead, HttpStatusCode.CONFLICT, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
                sinon.assert.calledWith(response.end, JSON.stringify({ message: 'No preset matching name [\'no-match\'] found' }));
            });
        });

        afterEach(() => {
            response.writeHead.reset();
            response.end.reset();
        });
    });

    describe('isApplicable', () => {
        it('indicates applicable when url and action match', () => {
            request.url = `${'/base-url'}/presets`;
            request.method = HttpMethods.PUT;
            expect(handler.isApplicable(request as any)).toBe(true);
        });
        it('indicates not applicable when the action does not match', () => {
            request.url = `${'/base-url'}/presets`;
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