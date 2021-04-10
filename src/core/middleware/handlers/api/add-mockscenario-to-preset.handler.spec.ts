import * as http from 'http';
import * as path from 'path';

import * as debug from 'debug';
import * as fs from 'fs-extra';
import { Container } from 'inversify';
import { createSpyObj } from 'jest-createspyobj';

import { Mock } from '../../../mock/mock';
import { Preset } from '../../../preset/preset';
import { State } from '../../../state/state';
import { HttpHeaders, HttpMethods, HttpStatusCode } from '../../http';
import { HandlerUtils } from '../handerutil';

import { AddMockScenarioToPresetHandler } from './add-mockscenario-to-preset.handler';

jest.mock('fs-extra');
describe('AddMockScenarioToPresetHandler', () => {
    let container: Container;
    let handler: AddMockScenarioToPresetHandler;
    let state: jest.Mocked<State>;

    beforeEach(() => {
        container = new Container();
        state = createSpyObj(State);
        container.bind('Configuration').toConstantValue({ middleware: { basePath: '/base-path' } });
        container.bind('AddMockScenarioToPresetHandler').to(AddMockScenarioToPresetHandler);
        container.bind('State').toConstantValue(state);
        handler = container.get<AddMockScenarioToPresetHandler>('AddMockScenarioToPresetHandler');
    });

    describe('handle', () => {
        let debugFn: jest.SpyInstance;
        let nextFn: jest.Mock;
        let request: http.IncomingMessage;
        let response: http.ServerResponse;

        beforeEach(() => {
            handler.addMockScenarioToPreset = jest.fn();

            debug.enable('ng-apimock:handler-add-mock-scenario-to-preset');
            debugFn = jest.spyOn(process.stderr, 'write');

            request = {
                url: '/base-path/presets/newpreset'
            } as http.IncomingMessage;
            response = {
                end: jest.fn(),
                writeHead: jest.fn()
            } as unknown as http.ServerResponse;
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should throw if the incoming request is NOT ok', () => {
            handler.handle(request as any, response as any, nextFn, {
                id: 'someId',
                body: {
                } as any
            });
            expect(debugFn).toHaveBeenCalledTimes(1);
            expect(debugFn).toHaveBeenCalledWith(expect.stringContaining('A new preset should have existing mocks with scenarios'));
            expect(response.writeHead).toHaveBeenCalledWith(409, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
        });
        it('should throw if the scenario does NOT exists', () => {
            HandlerUtils.checkIfPresetExists = jest.fn().mockReturnValue(false);
            handler.handle(request as any, response as any, nextFn, {
                id: 'someId',
                body: {
                    mockName: 'valid',
                    mockState: {
                        scenario: 'somescenario'
                    }
                }
            });
            expect(debugFn).toHaveBeenCalledTimes(1);
            expect(debugFn).toHaveBeenCalledWith(expect.stringContaining('No preset found with name: [newpreset]'));
            expect(response.writeHead).toHaveBeenCalledWith(409, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            expect(response.end).toHaveBeenCalledWith(JSON.stringify({ message: 'No preset found with name: [newpreset]' }));
        });
        it('should throw if the mock does NOT exists', () => {
            HandlerUtils.checkIfPresetExists = jest.fn().mockReturnValue(true);
            HandlerUtils.checkIfMockExists = jest.fn().mockReturnValue(false);
            HandlerUtils.checkIsScenarioExists = jest.fn().mockReturnValue(false);
            handler.handle(request as any, response as any, nextFn, {
                id: 'someId',
                body: {
                    mockName: 'valid',
                    mockState: {
                        scenario: 'somescenario'
                    }
                }
            });
            expect(debugFn).toHaveBeenCalledTimes(1);
            expect(debugFn).toHaveBeenCalledWith(expect.stringContaining('No mock found with name: [valid]'));
            expect(response.writeHead).toHaveBeenCalledWith(409, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            expect(response.end).toHaveBeenCalledWith(JSON.stringify({ message: 'No mock found with name: [valid]' }));
        });

        it('should throw if the Scenario does NOT exists', () => {
            HandlerUtils.checkIfPresetExists = jest.fn().mockReturnValue(true);
            HandlerUtils.checkIfMockExists = jest.fn().mockReturnValue(true);
            HandlerUtils.checkIsScenarioExists = jest.fn().mockReturnValue(false);
            handler.handle(request as any, response as any, nextFn, {
                id: 'someId',
                body: {
                    mockName: 'valid',
                    mockState: {
                        scenario: 'somescenario'
                    }
                }
            });

            expect(debugFn).toHaveBeenCalledTimes(1);
            expect(debugFn).toHaveBeenCalledWith(expect.stringContaining('No scenario found with name: [somescenario] in mock with name [valid]'));
            expect(response.writeHead).toHaveBeenCalledWith(409, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            expect(response.end).toHaveBeenCalledWith(
                JSON.stringify({ message: 'No scenario found with name: [somescenario] in mock with name [valid]' })
            );
        });
        it('should add the mock to the preset if it doen not exist', () => {
            handler.addMockScenarioToPreset = jest.fn();
            HandlerUtils.checkIfPresetExists = jest.fn().mockReturnValue(true);
            HandlerUtils.checkIfMockExists = jest.fn().mockReturnValue(true);
            HandlerUtils.checkIsScenarioExists = jest.fn().mockReturnValue(true);
            handler.handle(request as any, response as any, nextFn, {
                id: 'someId',
                body: {
                    mockName: 'valid',
                    mockState: {
                        scenario: 'somescenario'
                    }
                }
            });
            expect(debugFn).toHaveBeenCalledTimes(1);
            expect(debugFn).toHaveBeenCalledWith(expect.stringContaining('Added mock [valid] to preset'));
            expect(handler.addMockScenarioToPreset).toHaveBeenCalled();
        });
    });

    describe('addMockScenarioToPreset', () => {
        let outputJSONSync: jest.Mock;
        let readFileSync: jest.Mock;
        beforeEach(() => {
            const existingPreset: Preset = {
                name: 'newpreset',
                mocks: {},
                variables: {}
            };
            outputJSONSync = fs.outputJSONSync as jest.Mock;
            readFileSync = fs.readFileSync as jest.Mock;
            readFileSync.mockReturnValue(JSON.stringify(existingPreset));
            state.getProcessingOptions.mockReturnValue({
                src: 'the/mocks/path',
                patterns: {
                    mocks: '**/*.somemock.json',
                    presets: '**/*.somepreset.json'
                }
            });
        });
        it('shoud save the preset in the presetfolder with the proper extention folder', () => {
            handler.addMockScenarioToPreset('newpreset', 'somemock', {
                scenario: 'somescenario'
            });
            const expectedContent: Preset = {
                name: 'newpreset',
                mocks: {
                    somemock: {
                        scenario: 'somescenario'
                    }
                },
                variables: {}
            };
            expect(outputJSONSync).toHaveBeenCalledWith(path.join('the/mocks/path', 'newpreset.somepreset.json'),
                expectedContent, { spaces: 2 });
        });
    });

    describe('isApplicable', () => {
        let request: http.IncomingMessage;

        beforeEach(() => {
            request = {} as http.IncomingMessage;
        });

        it('indicates applicable when url and method match', () => {
            request.url = '/base-path/presets/somepreset';
            request.method = HttpMethods.PUT;
            expect(handler.isApplicable(request as any)).toBe(true);
        });

        it('indicates NOT applicable when url is preserved for selectpreset handler', () => {
            request.url = '/base-path/presets';
            request.method = HttpMethods.PUT;
            expect(handler.isApplicable(request as any)).toBe(false);
        });
        it('indicates not applicable when the method does not match', () => {
            request.url = '/base-path/presets';
            request.method = HttpMethods.POST;
            expect(handler.isApplicable(request as any)).toBe(false);

            request.url = '/base-path/something';
            request.method = HttpMethods.PUT;
            expect(handler.isApplicable(request as any)).toBe(false);
        });
    });
});
