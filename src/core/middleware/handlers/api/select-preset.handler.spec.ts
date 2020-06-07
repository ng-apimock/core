import * as http from 'http';
import {Container} from 'inversify';

import {IState} from '../../../state/Istate';
import {State} from '../../../state/state';
import {HttpHeaders, HttpMethods, HttpStatusCode} from '../../http';

import {SelectPresetHandler} from './select-preset.handler';

import {createSpyObj} from 'jest-createspyobj';

describe('SelectPresetHandler', () => {
    let container: Container;
    let handler: SelectPresetHandler;
    let matchingState: IState;
    let state: jest.Mocked<State>;

    beforeEach(() => {
        container = new Container();
        state = createSpyObj(State);

        container.bind('BaseUrl').toConstantValue('/base-url');
        container.bind('SelectPresetHandler').to(SelectPresetHandler);
        container.bind('State').toConstantValue(state);

        handler = container.get<SelectPresetHandler>('SelectPresetHandler');
    });

    describe('handle', () => {
        let nextFn: jest.Mock<Function>;
        let request: http.IncomingMessage;
        let response: http.ServerResponse;

        beforeEach(() => {
            nextFn = jest.fn();
            request = {} as http.IncomingMessage;
            response = {
                end: jest.fn(),
                writeHead: jest.fn()
            } as unknown as http.ServerResponse;

            (state as any).mocks = [{
                name: 'some',
                request: {url: '/one', method: 'GET'},
                responses: {'success': {}, 'failure': {}}
            }, {
                name: 'another',
                delay: 1000,
                request: {url: '/two', method: 'POST'},
                responses: {'success': {}, 'failure': {}}
            }];
            (state as any).presets = [{
                name: 'valid',
                mocks: {
                    some: {scenario: 'success', delay: 2000, echo: true},
                    another: {scenario: 'failure'}
                },
                variables: {today: 'some date'}
            }, {
                name: 'valid-no-mocks-and-variables'
            }, {
                name: 'invalid',
                mocks: {
                    some: {scenario: 'success', delay: 2000, echo: true},
                    another: {scenario: 'no-match'}
                },
                variables: {today: 'some date'}
            }];
            matchingState = {
                mocks: JSON.parse(JSON.stringify({
                    some: {scenario: 'failure', delay: 0, echo: true},
                    another: {scenario: 'success', delay: 1000, echo: false}
                })),
                variables: {},
                recordings: {},
                record: false
            };
            state.getMatchingState.mockReturnValue(matchingState);
        });

        describe('valid preset data', () => {
            beforeEach(() => {
                const body = {name: 'valid'};
                handler.handle(request as any, response as any, nextFn, {
                    id: 'apimockId',
                    body: body
                });
            });

            it('sets the mocks', () => {
                expect(matchingState.mocks['some'].scenario).toBe('success');
                expect(matchingState.mocks['some'].delay).toBe(2000);
                expect(matchingState.mocks['some'].echo).toBe(true);
                expect(matchingState.mocks['another'].scenario).toBe('failure');
                expect(matchingState.mocks['another'].delay).toBe(0); // defaults
                expect(matchingState.mocks['another'].echo).toBe(false); // defaults

                expect(response.writeHead).toHaveBeenCalledWith(HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
                expect(response.end).toHaveBeenCalled();
            });

            it('sets the variables', () => {
                expect(matchingState.variables['today']).toBe('some date');

                expect(response.writeHead).toHaveBeenCalledWith(HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
                expect(response.end).toHaveBeenCalled();
            });
        });

        describe('valid preset data but no mocks', () => {
            beforeEach(() => {
                const body = {name: 'valid-no-mocks-and-variables'};
                handler.handle(request as any, response as any, nextFn, {
                    id: 'apimockId',
                    body: body
                });
            });

            it('does not update the mocks', () => {
                expect(matchingState.mocks['some'].scenario).toBe('failure'); // defaults
                expect(matchingState.mocks['some'].delay).toBe(0); // defaults
                expect(matchingState.mocks['some'].echo).toBe(true); // defaults
                expect(matchingState.mocks['another'].scenario).toBe('success'); // defaults
                expect(matchingState.mocks['another'].delay).toBe(1000); // defaults
                expect(matchingState.mocks['another'].echo).toBe(false); // defaults

                expect(response.writeHead).toHaveBeenCalledWith(HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
                expect(response.end).toHaveBeenCalled();
            });

            it('does not update the variables', () => {
                expect(matchingState.variables['today']).toBeUndefined(); // defaults

                expect(response.writeHead).toHaveBeenCalledWith(HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
                expect(response.end).toHaveBeenCalled();
            });
        });

        describe('invalid preset data', () => {
            beforeEach(() => {
                const body = {name: 'invalid'};
                handler.handle(request as any, response as any, nextFn, {
                    id: 'apimockId',
                    body: body
                });
            });

            it('throws an error when the scenario does not match', () => {
                expect(response.writeHead).toHaveBeenCalledWith(HttpStatusCode.INTERNAL_SERVER_ERROR, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
                expect(response.end).toHaveBeenCalledWith(JSON.stringify({message: 'No scenario matching [\'no-match\'] found for mock with name [\'another\']'}));
            });
        });

        describe('no matching preset', () => {
            beforeEach(() => {
                const body = {name: 'no-match'};
                handler.handle(request as any, response as any, nextFn, {
                    id: 'apimockId',
                    body: body
                });
            });

            it('throws an error when the preset does not match', () => {
                expect(response.writeHead).toHaveBeenCalledWith(HttpStatusCode.CONFLICT, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
                expect(response.end).toHaveBeenCalledWith(JSON.stringify({message: 'No preset matching name [\'no-match\'] found'}));
            });
        });
    });

    describe('isApplicable', () => {
        let request: http.IncomingMessage;

        beforeEach(() => {
            request = {} as http.IncomingMessage;
        });

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
