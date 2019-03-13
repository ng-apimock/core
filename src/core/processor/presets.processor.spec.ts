import 'reflect-metadata';
import {Container} from 'inversify';

import * as fs from 'fs-extra';
import * as glob from 'glob';
import * as path from 'path';
import * as sinon from 'sinon';
import {State} from '../state/state';
import {PresetsProcessor} from './presets.processor';
import {DefaultProcessingOptions} from "./processing.options";

describe('PresetsProcessor', () => {
    let consoleLogFn: sinon.SinonStub;
    let consoleWarnFn: sinon.SinonStub;
    let container: Container;
    let doneFn: sinon.SinonStub;
    let fsReadJsonSyncFn: sinon.SinonStub;
    let globSyncFn: sinon.SinonStub;
    let state: sinon.SinonStubbedInstance<State>;
    let processor: PresetsProcessor;

    beforeAll(() => {
        container = new Container();
        doneFn = sinon.stub();
        state = sinon.createStubInstance(State);

        container.bind('State').toConstantValue(state);
        container.bind('PresetsProcessor').to(PresetsProcessor);

        consoleWarnFn = sinon.stub(console, 'warn');
        consoleLogFn = sinon.stub(console, 'log');
        fsReadJsonSyncFn = sinon.stub(fs, 'readJsonSync');
        globSyncFn = sinon.stub(glob, 'sync');

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
                    'some': { scenario: 'success', delay: 2000, echo: true },
                    'another': { scenario: 'success' }
                },
                variables: {
                    'today': 'some date'
                }
            });
            fsReadJsonSyncFn.onCall(1).returns({
                name: 'unhappy.preset',
                mocks: {
                    'some': { scenario: 'failure' },
                    'another': { scenario: 'error' }
                },
                variables: {
                    'today': 'some date'
                }
            });
            fsReadJsonSyncFn.onCall(2).returns({
                name: 'happy.preset',
                mocks: {
                    'some': { scenario: 'success' },
                    'another': { scenario: 'success' }
                },
                variables: {
                    'today': 'some date'
                }
            });
        });

        describe('by default', () => {
            beforeAll(() => {
                processor.process(Object.assign({}, DefaultProcessingOptions, { src: 'src' }));
            });

            it('processes each mock', () => {
                sinon.assert.calledWith(globSyncFn,
                    '**/*.preset.json', {
                        cwd: 'src', root: '/'
                    }
                );
                sinon.assert.calledWith(fsReadJsonSyncFn, path.join('src', 'preset/happy.preset.json'));
                sinon.assert.calledWith(fsReadJsonSyncFn, path.join('src', 'preset/unhappy.preset.json'));
                sinon.assert.calledWith(fsReadJsonSyncFn, path.join('src', 'preset/duplicate.preset.json'));
            });

            it('processes unique presets', () =>
                sinon.assert.calledWith(consoleLogFn, `Processed 2 unique presets.`));

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
                processor.process({ src: 'src', patterns: { presets: '**/*.mypreset.json' } });
            });
            it('processes each preset', () => {
                sinon.assert.calledWith(globSyncFn,
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
