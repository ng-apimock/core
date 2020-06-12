import * as path from 'path';

import * as fs from 'fs-extra';
import * as glob from 'glob';
import { Container } from 'inversify';
import { createSpyObj } from 'jest-createspyobj';

import { State } from '../state/state';

import { PresetsProcessor } from './presets.processor';
import { DefaultProcessingOptions } from './processing.options';

jest.mock('fs-extra');
jest.mock('glob');

describe('PresetsProcessor', () => {
    let container: Container;
    let state: jest.Mocked<State>;
    let processor: PresetsProcessor;

    beforeEach(() => {
        container = new Container();
        state = createSpyObj(State);

        container.bind('State').toConstantValue(state);
        container.bind('PresetsProcessor').to(PresetsProcessor);

        processor = container.get<PresetsProcessor>('PresetsProcessor');
    });

    describe('process', () => {
        let consoleLogFn: jest.Mock;
        let consoleWarnFn: jest.Mock;
        let doneFn: jest.Mock;
        let fsReadJsonSyncFn: jest.Mock;
        let globSyncFn: jest.Mock;

        beforeEach(() => {
            doneFn = jest.fn();

            consoleLogFn = console.log = jest.fn();
            consoleWarnFn = console.warn = jest.fn();
            fsReadJsonSyncFn = fs.readJsonSync as jest.Mock;
            globSyncFn = glob.sync as jest.Mock;

            (state as any).presets = [];
            globSyncFn.mockReturnValue([
                'preset/happy.preset.json',
                'preset/unhappy.preset.json',
                'preset/duplicate.preset.json']);
            fsReadJsonSyncFn.mockReturnValueOnce({
                name: 'happy.preset',
                mocks: {
                    some: { scenario: 'success', delay: 2000, echo: true },
                    another: { scenario: 'success' }
                },
                variables: { today: 'some date' }
            });
            fsReadJsonSyncFn.mockReturnValueOnce({
                name: 'unhappy.preset',
                mocks: { some: { scenario: 'failure' }, another: { scenario: 'error' } },
                variables: { today: 'some date' }
            });
            fsReadJsonSyncFn.mockReturnValue({
                name: 'happy.preset',
                mocks: { some: { scenario: 'success' }, another: { scenario: 'success' } },
                variables: { today: 'some date' }
            });
        });

        describe('by default', () => {
            beforeEach(() => {
                processor.process({ ...DefaultProcessingOptions, src: 'src' });
            });

            it('processes each mock', () => {
                expect(globSyncFn).toHaveBeenCalledWith(
                    '**/*.preset.json', {
                        cwd: 'src', root: '/'
                    }
                );
                expect(fsReadJsonSyncFn).toHaveBeenCalledWith(path.join('src', 'preset/happy.preset.json'));
                expect(fsReadJsonSyncFn).toHaveBeenCalledWith(path.join('src', 'preset/unhappy.preset.json'));
                expect(fsReadJsonSyncFn).toHaveBeenCalledWith(path.join('src', 'preset/duplicate.preset.json'));
            });

            it('processes unique presets', () => expect(consoleLogFn).toHaveBeenCalledWith('Processed 2 unique presets.'));
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
    });
});
