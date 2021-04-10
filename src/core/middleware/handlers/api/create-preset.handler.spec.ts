import * as http from 'http';
import * as path from 'path';

import * as debug from 'debug';
import * as fs from 'fs-extra';
import { Container } from 'inversify';
import { createSpyObj } from 'jest-createspyobj';

import { Preset } from '../../../preset/preset';
import { State } from '../../../state/state';
import { HttpHeaders, HttpMethods } from '../../http';
import { HandlerUtils } from '../handerutil';

import { CreatePresetHandler } from './create-preset.handler';

jest.mock('fs-extra');
jest.mock('../handerutil');

describe('CreatePresetHandler', () => {
    let container: Container;
    let handler: CreatePresetHandler;
    let state: jest.Mocked<State>;

    beforeEach(() => {
        container = new Container();
        state = createSpyObj(State);
        container.bind('Configuration').toConstantValue({ middleware: { basePath: '/base-path' } });
        container.bind('CreatePresetHandler').to(CreatePresetHandler);
        container.bind('State').toConstantValue(state);
        handler = container.get<CreatePresetHandler>('CreatePresetHandler');
    });

    describe('handle', () => {
        let debugFn: jest.SpyInstance;
        let nextFn: jest.Mock;
        let request: http.IncomingMessage;
        let response: http.ServerResponse;

        beforeEach(() => {
            handler.savePreset = jest.fn();

            debug.enable('ng-apimock:handler-create-preset');
            debugFn = jest.spyOn(process.stderr, 'write');

            request = {} as http.IncomingMessage;
            response = {
                end: jest.fn(),
                writeHead: jest.fn()
            } as unknown as http.ServerResponse;
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should throw if the incoming request is not if the type Preset', () => {
            handler.handle(request as any, response as any, nextFn, {
                id: 'someId',
                body: {
                    name: 'valid'
                } as Preset
            });
            expect(response.writeHead).toHaveBeenCalledWith(409, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
        });
        it('should throw if the Preset already exists', () => {
            HandlerUtils.checkIfPresetExists = jest.fn().mockReturnValue(true);
            handler.handle(request as any, response as any, nextFn, {
                id: 'someId',
                body: {
                    name: 'valid',
                    mocks: {},
                    variables: {}
                } as Preset
            });
            expect(debugFn).toHaveBeenCalledTimes(1);
            expect(debugFn).toHaveBeenCalledWith(expect.stringContaining('Preset with name: [valid] already exists'));
            expect(response.writeHead).toHaveBeenCalledWith(409, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            expect(response.end).toHaveBeenCalledWith(JSON.stringify({ message: 'Preset with name: [valid] already exists' }));
        });
        it('should save the Preset is the the preset is valid and does not yet exist', () => {
            handler.savePreset = jest.fn();
            HandlerUtils.checkIfPresetExists = jest.fn().mockReturnValue(false);
            handler.handle(request as any, response as any, nextFn, {
                id: 'someId',
                body: {
                    name: 'valid',
                    mocks: {},
                    variables: {}
                } as unknown as Preset
            });
            expect(debugFn).toHaveBeenCalledTimes(1);
            expect(debugFn).toHaveBeenCalledWith(expect.stringContaining('Created preset [valid]'));
            expect(handler.savePreset).toHaveBeenCalled();
        });
    });

    describe('savePreset', () => {
        let outputJSONSync: jest.Mock;
        let mockPostData: Preset;
        beforeEach(() => {
            outputJSONSync = fs.outputJSONSync as jest.Mock;
            state.getProcessingOptions.mockReturnValue({
                src: 'the/mocks/path',
                patterns: {
                    presets: '**/**.custom.json'
                }
            });
            mockPostData = {
                name: 'newname',
                mocks: {},
                variables: {}

            };
        });
        it('shoud save the preset in the configured folder with the configured extention', () => {
            handler.savePreset(mockPostData);
            expect(outputJSONSync).toHaveBeenCalledWith(path.join('the/mocks/path', 'newname.custom.json'), mockPostData, { spaces: 2 });
        });
    });

    describe('isApplicable', () => {
        let request: http.IncomingMessage;

        beforeEach(() => {
            request = {} as http.IncomingMessage;
        });

        it('indicates applicable when url and method match', () => {
            request.url = '/base-path/presets/somepreset';
            request.method = HttpMethods.POST;
            expect(handler.isApplicable(request as any)).toBe(true);
        });

        it('should not match on the default presets path', () => {
            request.url = '/base-path/presets';
            request.method = HttpMethods.POST;
            expect(handler.isApplicable(request as any)).toBe(true);
        });
        it('indicates not applicable when the method does not match', () => {
            request.url = '/base-path/presets';
            request.method = HttpMethods.PUT;
            expect(handler.isApplicable(request as any)).toBe(false);
        });
    });
});
