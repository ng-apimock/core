import * as chokidar from 'chokidar';
import {assert, createStubInstance, match, SinonStub, SinonStubbedInstance, stub} from 'sinon';
import {Container} from 'inversify';
import {MocksProcessor} from './mocks.processor';
import {Processor} from './processor';
import {PresetsProcessor} from './presets.processor';

describe('MocksProcessor', () => {
    let container: Container;
    let mocksProcessor: sinon.SinonStubbedInstance<MocksProcessor>;
    let presetsProcessor: sinon.SinonStubbedInstance<PresetsProcessor>;
    let processor: Processor;

    beforeEach(() => {
        container = new Container();
        mocksProcessor = createStubInstance(MocksProcessor);
        presetsProcessor = createStubInstance(PresetsProcessor);

        container.bind('MocksProcessor').toConstantValue(mocksProcessor);
        container.bind('PresetsProcessor').toConstantValue(presetsProcessor);
        container.bind('Processor').to(Processor);

        processor = container.get<Processor>('Processor');
    });

    describe('process', () => {
        let chokidarWatchFn: SinonStub;
        let fsWatcher: SinonStubbedInstance<chokidar.FSWatcher>;
        let getMergedOptionsFn: SinonStub;

        beforeEach(() => {
            fsWatcher = createStubInstance(chokidar.FSWatcher);

            chokidarWatchFn = stub(chokidar, <any>'watch');
            getMergedOptionsFn = stub(processor, <any>'getMergedOptions');

            chokidarWatchFn.returns(fsWatcher);
            getMergedOptionsFn.callsFake((options) => options);
        });

        afterEach(() => {
            mocksProcessor.process.reset();
            presetsProcessor.process.reset();
            chokidarWatchFn.restore();
            getMergedOptionsFn.restore();
        });

        describe('default', () => {
            beforeEach(() => {
                processor.process({
                    src: 'src', patterns: {mocks: 'mocks-pattern', presets: 'presets-pattern'}
                });
            });

            it('merges with the default options', () =>
                assert.calledWith(getMergedOptionsFn, {
                    src: 'src', patterns: {mocks: 'mocks-pattern', presets: 'presets-pattern'}
                }));

            it('processes the mocks', () =>
                assert.calledWith(mocksProcessor.process, {
                    src: 'src', patterns: {mocks: 'mocks-pattern', presets: 'presets-pattern'}
                }));

            it('processes the presets', () =>
                assert.calledWith(presetsProcessor.process, {
                    src: 'src', patterns: {mocks: 'mocks-pattern', presets: 'presets-pattern'}
                }));

            it('does not watch for mock changes', async () => {
                assert.neverCalledWith(chokidarWatchFn, 'src/mocks-pattern', {
                    ignoreInitial: true, usePolling: true, interval: 2000
                });
            });

            it('does not watch for preset changes', async () => {
                assert.neverCalledWith(chokidarWatchFn, 'src/presets-pattern', {
                    ignoreInitial: true, usePolling: true, interval: 2000
                });
            });
        });

        describe('watch', () => {
            beforeEach(() => {
                processor.process({
                    src: 'src', patterns: {mocks: 'mocks-pattern', presets: 'presets-pattern'},
                    watch: true
                });
            });

            it('watches for mock changes', async () => {
                assert.calledWith(chokidarWatchFn, 'src/mocks-pattern', {
                    ignoreInitial: true, usePolling: true, interval: 2000
                });

                assert.calledWith(fsWatcher.on, 'all', match.any);
                assert.callCount(mocksProcessor.process, 1);

                const onAllCall = fsWatcher.on.getCall(0);

                expect(onAllCall.args[0]).toBe('all');
                await onAllCall.callArg(1); // call the callback function.

                assert.callCount(mocksProcessor.process, 2);
            });

            it('watches for preset changes', async () => {
                assert.calledWith(chokidarWatchFn, 'src/presets-pattern', {
                    ignoreInitial: true, usePolling: true, interval: 2000
                });

                assert.calledWith(fsWatcher.on, 'all', match.any);
                assert.callCount(presetsProcessor.process, 1);

                const onAllCall = fsWatcher.on.getCall(1);

                expect(onAllCall.args[0]).toBe('all');
                await onAllCall.callArg(1); // call the callback function.

                assert.callCount(presetsProcessor.process, 2);
            });
        });
    });
});
