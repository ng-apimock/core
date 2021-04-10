import * as path from 'path';

import * as debug from 'debug';
import * as fs from 'fs-extra';
import * as glob from 'glob';

import { Converter } from './convert';

jest.mock('fs-extra');
jest.mock('glob');

describe('Converter', () => {
    let converter: Converter;

    beforeEach(() => {
        converter = new Converter();
    });

    describe('convert', () => {
        let debugFn: jest.SpyInstance;
        let fsOutputJsonSyncFn: jest.Mock;
        let fsReadJsonSyncFn: jest.Mock;
        let globSyncFn: jest.Mock;

        beforeEach(() => {
            debug.enable('ng-apimock:convert');
            debugFn = jest.spyOn(process.stderr, 'write');
            fsReadJsonSyncFn = fs.readJsonSync as jest.Mock;
            fsOutputJsonSyncFn = fs.outputJsonSync as jest.Mock;
            globSyncFn = glob.sync as jest.Mock;

            globSyncFn.mockReturnValue(['mock/old.mock.json', 'mock/new.mock.json']);
            fsReadJsonSyncFn.mockReturnValueOnce({
                name: 'old.mock',
                expression: 'old/mock',
                method: 'GET',
                responses: { 'old-json-response': {} },
            });
            fsReadJsonSyncFn.mockReturnValue({
                name: 'new.mock',
                request: { url: 'new/mock', method: 'GET' },
                responses: { 'new-json-response': {} },
            });
        });

        describe('by default', () => {
            beforeEach(() => {
                converter.convert('src', 'destination');
            });

            afterEach(() => {
                jest.resetAllMocks();
            });

            it('processes all files', () => expect(globSyncFn).toHaveBeenCalledWith('**/*.mock.json', { cwd: 'src' }));

            it('reads all the mock files', () => {
                expect(fsReadJsonSyncFn).toHaveBeenCalledWith(path.join('src', 'mock', 'old.mock.json'));
                expect(fsReadJsonSyncFn).toHaveBeenCalledWith(path.join('src', 'mock', 'new.mock.json'));
            });

            it('converts old mock.json', () => expect(fsOutputJsonSyncFn).toHaveBeenCalledWith(path.join(process.cwd(), 'destination', 'mock', 'old.mock.json'), {
                name: 'old.mock',
                request: { method: 'GET', url: 'old/mock' },
                responses: { 'old-json-response': {} },
            }, { spaces: 2 }));

            it('does not convert new mock.json', () => expect(fsOutputJsonSyncFn).toHaveBeenCalledWith(path.join(process.cwd(), 'destination', 'mock', 'new.mock.json'), {
                name: 'new.mock',
                request: { method: 'GET', url: 'new/mock' },
                responses: { 'new-json-response': {} },
            }, { spaces: 2 }));

            it('updates each mock', () => {
                expect(debugFn).toHaveBeenCalledTimes(3);
                expect(debugFn).toHaveBeenCalledWith(expect.stringContaining('Converting mocks'));
                expect(debugFn).toHaveBeenCalledWith(expect.stringContaining('src/mock/old.mock.json'));
                expect(debugFn).toHaveBeenCalledWith(expect.stringContaining('src/mock/new.mock.json'));
            });
        });
        describe('without a specified pattern', () => {
            beforeEach(() => {
                converter.convert('src', 'destination', 'my/patterm.json');
            });

            it('processes all files', () => expect(globSyncFn).toHaveBeenCalledWith('my/patterm.json', { cwd: 'src' }));
        });
    });
});
