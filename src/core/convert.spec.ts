import {Converter} from './convert';
import * as fs from 'fs-extra';
import * as glob from 'glob';
import * as path from 'path';
import {assert, SinonStub, stub} from 'sinon';

describe('Converter', () => {
    let converter: Converter;
    let consoleLogFn: SinonStub;
    let fsReadJsonSyncFn: SinonStub;
    let fsOutputJsonSyncFn: SinonStub;
    let globSyncFn: SinonStub;

    beforeEach(() => {
        fsReadJsonSyncFn = stub(fs, 'readJsonSync');
        fsOutputJsonSyncFn = stub(fs, 'outputJsonSync');
        globSyncFn = stub(glob, 'sync');
        consoleLogFn = stub(console, 'log');
        converter = new Converter();
    });

    describe('convert', () => {
        beforeEach(() => {
            globSyncFn.returns([
                'mock/old.mock.json',
                'mock/new.mock.json']);
            fsReadJsonSyncFn.onCall(0).returns({
                name: 'old.mock',
                expression: 'old/mock',
                method: 'GET',
                responses: { 'old-json-response': {} }
            });
            fsReadJsonSyncFn.onCall(1).returns({
                name: 'new.mock',
                request: {
                    url: 'new/mock',
                    method: 'GET'
                },
                responses: { 'new-json-response': {} }
            });

        });
        describe('by default', () => {
            beforeEach(() => {
                converter.convert('src', 'destination');
            });

            it('processes all files', () => {
                assert.calledWith(globSyncFn, '**/*.mock.json', { cwd: 'src' });
            });

            it('reads all the mock files', () => {
                assert.calledWith(fsReadJsonSyncFn, path.join('src', 'mock', 'old.mock.json'));
                assert.calledWith(fsReadJsonSyncFn, path.join('src', 'mock', 'new.mock.json'));
            });

            it('converts old mock.json', () => {
                assert.calledWith(fsOutputJsonSyncFn, path.join(process.cwd(), 'destination', 'mock', 'old.mock.json'), {
                    name: "old.mock",
                    request: { method: "GET", url: "old/mock" },
                    responses: {
                        'old-json-response': {}
                    }
                });
            });

            it('does not convert new mock.json', () => {
                assert.calledWith(fsOutputJsonSyncFn, path.join(process.cwd(), 'destination', 'mock', 'new.mock.json'), {
                    name: "new.mock",
                    request: { method: "GET", url: "new/mock" },
                    responses: {
                        'new-json-response': {}
                    }
                });
            });
        });
        describe('without a specified pattern', () => {
            beforeEach(() => {
                converter.convert('src', 'destination', 'my/patterm.json');
            });

            it('processes all files', () => {
                assert.calledWith(globSyncFn, 'my/patterm.json', { cwd: 'src' });
            });
        });

        afterEach(() => {
            fsReadJsonSyncFn.reset();
            fsOutputJsonSyncFn.reset();
            globSyncFn.reset();
        });
    });

    afterEach(() => {
        fsReadJsonSyncFn.restore();
        fsOutputJsonSyncFn.restore();
        globSyncFn.restore();
        consoleLogFn.restore();
    });
});