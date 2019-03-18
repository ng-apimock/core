import 'reflect-metadata';
import {Container} from 'inversify';

import * as fs from 'fs-extra';
import * as glob from 'glob';
import * as path from 'path';
import {assert, createStubInstance, SinonStub, SinonStubbedInstance, stub} from 'sinon';
import {State} from '../state/state';
import {PresetsProcessor} from './presets.processor';
import {DefaultProcessingOptions} from './processing.options';

describe('PresetsProcessor', () => {
    let consoleLogFn: SinonStub;
    let consoleWarnFn: SinonStub;
    let container: Container;
    let doneFn: SinonStub;
    let fsReadJsonSyncFn: SinonStub;
    let globSyncFn: SinonStub;
    let state: SinonStubbedInstance<State>;
    let processor: PresetsProcessor;

    beforeAll(() => {
        container = new Container();
        doneFn = stub();
        state = createStubInstance(State);

        container.bind('State').toConstantValue(state);
        container.bind('PresetsProcessor').to(PresetsProcessor);

        consoleWarnFn = stub(console, 'warn');
        consoleLogFn = stub(console, 'log');
        fsReadJsonSyncFn = stub(fs, 'readJsonSync');
        globSyncFn = stub(glob, 'sync');

        processor = container.get<PresetsProcessor>('PresetsProcessor');
    });

    describe('process', () => {
        beforeAll(() => {
            (state as any)._presets = [];
            globSyncFn.returns([
                'preset/happy.preset.json',
                'preset/unhappy.preset.json',
                'preset/duplicate.preset.json']);
            fsReadJsonSyncFn.onCall(0).returns({
                name: 'happy.preset',
                mocks: {
                    'some': {scenario: 'success', delay: 2000, echo: true},
                    'another': {scenario: 'success'}
                },
                variables: {
                    'today': 'some date'
                }
            });
            fsReadJsonSyncFn.onCall(1).returns({
                name: 'unhappy.preset',
                mocks: {
                    'some': {scenario: 'failure'},
                    'another': {scenario: 'error'}
                },
                variables: {
                    'today': 'some date'
                }
            });
            fsReadJsonSyncFn.onCall(2).returns({
                name: 'happy.preset',
                mocks: {
                    'some': {scenario: 'success'},
                    'another': {scenario: 'success'}
                },
                variables: {
                    'today': 'some date'
                }
            });
        });

        describe('by default', () => {
            beforeAll(() => {
                processor.process(Object.assign({}, DefaultProcessingOptions, {src: 'src'}));
            });

            it('processes each mock', () => {
                assert.calledWith(globSyncFn,
                    '**/*.preset.json', {
                        cwd: 'src', root: '/'
                    }
                );
                assert.calledWith(fsReadJsonSyncFn, path.join('src', 'preset/happy.preset.json'));
                assert.calledWith(fsReadJsonSyncFn, path.join('src', 'preset/unhappy.preset.json'));
                assert.calledWith(fsReadJsonSyncFn, path.join('src', 'preset/duplicate.preset.json'));
            });

            it('processes unique presets', () =>
                assert.calledWith(consoleLogFn, `Processed 2 unique presets.`));

            afterAll(() => {
                consoleLogFn.reset();
                consoleWarnFn.reset();
                fsReadJsonSyncFn.reset();
                globSyncFn.reset();
            });
        });

        describe('with full processing options', () => {
            beforeAll(() => {
                globSyncFn.returns([]);
                processor.process({src: 'src', patterns: {presets: '**/*.mypreset.json'}});
            });
            it('processes each preset', () => {
                assert.calledWith(globSyncFn,
                    '**/*.mypreset.json', {
                        cwd: 'src', root: '/'
                    }
                );
            });
        });
    });

    afterAll(() => {
        consoleLogFn.restore();
        consoleWarnFn.restore();
        fsReadJsonSyncFn.restore();
        globSyncFn.restore();
    });
});
