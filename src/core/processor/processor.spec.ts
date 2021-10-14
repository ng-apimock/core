import * as chokidar from 'chokidar';
import {Container} from 'inversify';
import {createSpyObj} from 'jest-createspyobj';

import {State} from '../state/state';

import {MocksProcessor} from './mocks.processor';
import {PresetsProcessor} from './presets.processor';
import {Processor} from './processor';
import {GeneratedProcessingOptions} from "./processing.options";

jest.mock('fs-extra');
jest.mock('chokidar');

describe('MocksProcessor', () => {
    let container: Container;
    let mocksProcessor: jest.Mocked<MocksProcessor>;
    let state: jest.Mocked<State>;
    let presetsProcessor: jest.Mocked<PresetsProcessor>;
    let processor: Processor;

    beforeEach(() => {
        container = new Container();
        mocksProcessor = createSpyObj(MocksProcessor);
        state = createSpyObj(State);
        presetsProcessor = createSpyObj(PresetsProcessor);

        container.bind('State').toConstantValue(state);
        container.bind('MocksProcessor').toConstantValue(mocksProcessor);
        container.bind('PresetsProcessor').toConstantValue(presetsProcessor);
        container.bind('Processor').to(Processor);

        processor = container.get<Processor>('Processor');
    });

    describe('process', () => {
        let chokidarWatchFn: jest.Mock;
        let fsWatcher: jest.Mocked<chokidar.FSWatcher>;
        let getMergedOptionsFn: jest.SpyInstance;

        beforeEach(() => {
            fsWatcher = createSpyObj(chokidar.FSWatcher);

            chokidarWatchFn = chokidar.watch as jest.Mock;
            getMergedOptionsFn = jest.spyOn(processor, <any>'getMergedOptions');

            chokidarWatchFn.mockReturnValue(fsWatcher);
            getMergedOptionsFn.mockImplementation((options) => options);
        });

        describe('default', () => {
            beforeEach(() => {
                processor.process({
                    src: 'src', patterns: {mocks: 'mocks-pattern', presets: 'presets-pattern'}
                });
            });

            it('merges with the default options', () => expect(getMergedOptionsFn).toHaveBeenCalledWith({
                src: 'src', patterns: {mocks: 'mocks-pattern', presets: 'presets-pattern'}
            }));

            it('processes the mocks', () => expect(mocksProcessor.process).toHaveBeenCalledWith({
                src: 'src', patterns: {mocks: 'mocks-pattern', presets: 'presets-pattern'}
            }));

            it('processes the presets', () => expect(presetsProcessor.process).toHaveBeenCalledWith({
                src: 'src', patterns: {mocks: 'mocks-pattern', presets: 'presets-pattern'}
            }));

            it('does not watch for mock changes', async () => {
                expect(chokidarWatchFn).not.toHaveBeenCalledWith('src/mocks-pattern', {
                    ignoreInitial: true, usePolling: true, interval: 2000
                });
            });

            it('does not watch for preset changes', async () => {
                expect(chokidarWatchFn).not.toHaveBeenCalledWith('src/presets-pattern', {
                    ignoreInitial: true, usePolling: true, interval: 2000
                });
            });

            it('watches for generated preset changes', async () => {
                expect(chokidarWatchFn).toHaveBeenCalledWith(
                    `${GeneratedProcessingOptions.src}/${GeneratedProcessingOptions.patterns.presets}`,
                    {ignoreInitial: true, usePolling: true, interval: 2000});
            });
        });

        describe('watch', () => {
            beforeEach(() => {
                processor.process({
                    src: 'src',
                    patterns: {mocks: 'mocks-pattern', presets: 'presets-pattern'},
                    watch: true
                });
            });

            it('watches for mock changes', async () => {
                expect(chokidarWatchFn).toHaveBeenCalledWith('src/mocks-pattern', {
                    ignoreInitial: true, usePolling: true, interval: 2000
                });

                expect(fsWatcher.on).toHaveBeenCalledWith('all', expect.anything());
                expect(mocksProcessor.process).toHaveBeenCalledTimes(1);

                const onAllCall = fsWatcher.on.mock.calls[0];

                expect(onAllCall[0]).toBe('all');
                await onAllCall[1](); // call the callback function.

                expect(mocksProcessor.process).toHaveBeenCalledTimes(2);
            });

            it('watches for preset changes and generated preset', async () => {
                expect(chokidarWatchFn).toHaveBeenCalledWith('src/presets-pattern', {
                    ignoreInitial: true, usePolling: true, interval: 2000
                });

                expect(fsWatcher.on).toHaveBeenCalledWith('all', expect.anything());
                expect(presetsProcessor.process).toHaveBeenCalledTimes(2); // also for generated

                const onAllCall = fsWatcher.on.mock.calls[1];

                expect(onAllCall[0]).toBe('all');
                await onAllCall[1](); // call the callback function.

                expect(presetsProcessor.process).toHaveBeenCalledTimes(3);
            });
        });

        describe('watch - with mock watches set', () => {
            beforeEach(() => {
                processor.process({
                    src: 'src',
                    patterns: {mocks: 'mocks-pattern', presets: 'presets-pattern'},
                    watches: {mocks: 'mock-watches'},
                    watch: true
                });
            });

            it('watches for mock watches changes when set', async () => {
                expect(chokidarWatchFn).toHaveBeenCalledWith('src/mock-watches', {
                    ignoreInitial: true, usePolling: true, interval: 2000
                });

                expect(fsWatcher.on).toHaveBeenCalledWith('all', expect.anything());
                expect(mocksProcessor.process).toHaveBeenCalledTimes(1);

                const onAllCall = fsWatcher.on.mock.calls[0];

                expect(onAllCall[0]).toBe('all');
                await onAllCall[1](); // call the callback function.

                expect(mocksProcessor.process).toHaveBeenCalledTimes(2);
            });
        });

        describe('watch - with preset watches set', () => {
            beforeEach(() => {
                processor.process({
                    src: 'src',
                    patterns: {mocks: 'mocks-pattern', presets: 'presets-pattern'},
                    watches: {presets: 'presets-watches'},
                    watch: true
                });
            });

            it('watches for preset watches changes when set', async () => {
                expect(chokidarWatchFn).toHaveBeenCalledWith('src/presets-watches', {
                    ignoreInitial: true, usePolling: true, interval: 2000
                });

                expect(fsWatcher.on).toHaveBeenCalledWith('all', expect.anything());
                expect(mocksProcessor.process).toHaveBeenCalledTimes(1);

                const onAllCall = fsWatcher.on.mock.calls[0];

                expect(onAllCall[0]).toBe('all');
                await onAllCall[1](); // call the callback function.

                expect(mocksProcessor.process).toHaveBeenCalledTimes(2);
            });
        });
    });
});
