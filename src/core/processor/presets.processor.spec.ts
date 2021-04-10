import * as path from 'path';

import * as debug from 'debug';
import * as glob from 'glob';
import { Container } from 'inversify';
import { createSpyObj } from 'jest-createspyobj';

import { State } from '../state/state';

import { FileLoader } from './file.loader';
import { PresetsProcessor } from './presets.processor';
import { DefaultProcessingOptions } from './processing.options';

jest.mock('fs-extra');
jest.mock('glob');

describe('PresetsProcessor', () => {
    let container: Container;
    let state: jest.Mocked<State>;
    let fileLoader: jest.Mocked<FileLoader>;
    let processor: PresetsProcessor;

    beforeEach(() => {
        container = new Container();
        state = createSpyObj(State);
        fileLoader = createSpyObj(FileLoader);

        container.bind('State').toConstantValue(state);
        container.bind('FileLoader').toConstantValue(fileLoader);
        container.bind('PresetsProcessor').to(PresetsProcessor);

        processor = container.get<PresetsProcessor>('PresetsProcessor');
    });

    describe('process', () => {
        let debugFn: jest.SpyInstance;
        let doneFn: jest.Mock;
        let loadFileFn: jest.Mock;
        let globSyncFn: jest.Mock;

        beforeEach(() => {
            doneFn = jest.fn();

            debug.enable('ng-apimock:processor-preset');
            debugFn = jest.spyOn(process.stderr, 'write');
            loadFileFn = fileLoader.loadFile as jest.Mock;
            globSyncFn = glob.sync as jest.Mock;

            (state as any).presets = [];
            globSyncFn.mockReturnValue([
                'preset/happy.preset.json',
                'preset/unhappy.preset.json',
                'preset/duplicate.preset.json']);
            loadFileFn.mockReturnValueOnce({
                name: 'happy.preset',
                mocks: {
                    some: { scenario: 'success', delay: 2000, echo: true },
                    another: { scenario: 'success' }
                },
                variables: { today: 'some date' }
            });
            loadFileFn.mockReturnValueOnce({
                name: 'unhappy.preset',
                mocks: { some: { scenario: 'failure' }, another: { scenario: 'error' } },
                variables: { today: 'some date' }
            });
            loadFileFn.mockReturnValue({
                name: 'happy.preset',
                mocks: { some: { scenario: 'success' }, another: { scenario: 'success' } },
                variables: { today: 'some date' }
            });
        });

        describe('by default', () => {
            beforeEach(() => {
                processor.process({ ...DefaultProcessingOptions, src: 'src' });
            });

            afterEach(() => {
                jest.clearAllMocks();
            });

            it('processes each mock', () => {
                expect(globSyncFn).toHaveBeenCalledWith(
                    '**/*.preset.json', {
                        cwd: 'src', root: '/'
                    }
                );
                expect(loadFileFn).toHaveBeenCalledWith(path.join('src', 'preset/happy.preset.json'));
                expect(loadFileFn).toHaveBeenCalledWith(path.join('src', 'preset/unhappy.preset.json'));
                expect(loadFileFn).toHaveBeenCalledWith(path.join('src', 'preset/duplicate.preset.json'));
            });

            it('processes unique presets', () => {
                expect(debugFn).toHaveBeenCalledTimes(2);
                expect(debugFn).toHaveBeenCalledWith(expect.stringContaining('Preset with identifier \'happy.preset\' already exists. Overwriting existing preset.'));
                expect(debugFn).toHaveBeenCalledWith(expect.stringContaining('Processed 2 unique presets.'));
            });
        });

        describe('with full processing options', () => {
            beforeEach(() => {
                globSyncFn.mockReturnValue([]);
                processor.process({ src: 'src', patterns: { presets: '**/*.mypreset.json' } });
            });
            it('processes each preset', () => {
                expect(globSyncFn).toHaveBeenCalledWith(
                    '**/*.mypreset.json', {
                        cwd: 'src', root: '/'
                    }
                );
            });
        });

        describe('with preset watches set', () => {
            beforeEach(() => {
                globSyncFn.mockReturnValue([]);
                processor.process({
                    src: 'src',
                    patterns: { presets: '**/*.mypreset.json' },
                    watches: { presets: '**/*' }
                });
            });
            it('processes each preset watch and preset', () => {
                expect(globSyncFn).toHaveBeenCalledWith(
                    '**/*', {
                        cwd: 'src', root: '/', nodir: true
                    }
                );
                expect(globSyncFn).toHaveBeenCalledWith(
                    '**/*.mypreset.json', {
                        cwd: 'src', root: '/'
                    }
                );
            });
        });
    });
});
