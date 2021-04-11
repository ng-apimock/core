import * as path from 'path';

import * as debug from 'debug';
import * as glob from 'glob';
import { Container } from 'inversify';
import { createSpyObj } from 'jest-createspyobj';

import { HttpHeaders } from '../middleware/http';
import { GlobalState } from '../state/global.state';
import { State } from '../state/state';

import { FileLoader } from './file.loader';
import { MocksProcessor } from './mocks.processor';
import { DefaultProcessingOptions } from './processing.options';

jest.mock('fs-extra');
jest.mock('glob');

describe('MocksProcessor', () => {
    let container: Container;
    let state: jest.Mocked<State>;
    let fileLoader: jest.Mocked<FileLoader>;
    let processor: MocksProcessor;

    beforeEach(() => {
        container = new Container();
        state = createSpyObj(State);
        fileLoader = createSpyObj(FileLoader);

        container.bind('State').toConstantValue(state);
        container.bind('FileLoader').toConstantValue(fileLoader);
        container.bind('MocksProcessor').to(MocksProcessor);

        processor = container.get<MocksProcessor>('MocksProcessor');
    });

    describe('process', () => {
        let debugFn: jest.SpyInstance;
        let doneFn: jest.Mock;
        let loadFileFn: jest.Mock;
        let globSyncFn: jest.Mock;

        beforeEach(() => {
            doneFn = jest.fn();

            debug.enable('ng-apimock:processor-mock');
            debugFn = jest.spyOn(process.stderr, 'write');
            loadFileFn = fileLoader.loadFile as jest.Mock;
            globSyncFn = glob.sync as jest.Mock;

            (state as any).mocks = [];
            (state as any).defaults = {};
            (state as any).global = new GlobalState();
            globSyncFn.mockReturnValue([
                'mock/minimal-json-request.mock.json',
                'mock/minimal-binary-request.mock.json',
                'mock/full-request.mock.json',
                'mock/duplicate-request.mock.json']);
            loadFileFn.mockReturnValueOnce({
                name: 'minimal-json-request',
                request: { url: 'minimal/json/url', method: 'GET' },
                responses: { 'minimal-json-response': {} }
            });
            loadFileFn.mockReturnValueOnce({
                name: 'minimal-binary-request',
                request: { url: 'minimal/binary/url', method: 'GET' },
                responses: { 'minimal-binary-response': { file: 'some.pdf' } }
            });
            loadFileFn.mockReturnValueOnce({
                name: 'full-request',
                isArray: true,
                delay: 1000,
                request: {
                    url: 'full/url',
                    method: 'GET',
                    headers: { 'Cache-control': 'no-store' },
                    body: { uuid: '\\d+' }
                },
                responses: {
                    'full-response': {
                        status: 404,
                        data: [{ a: 'a' }],
                        headers: { 'Content-type': 'application/something' },
                        statusText: 'oops',
                        default: true
                    },
                    'another-full-response': {
                        status: 500,
                        data: [{ a: 'a' }],
                        headers: { 'Content-type': 'application/something' },
                        file: 'some.pdf',
                        statusText: 'oops',
                        default: false
                    }
                }
            });
            loadFileFn.mockReturnValue({
                name: 'minimal-json-request',
                request: { url: 'duplicate/url', method: 'GET' },
                responses: { 'duplicate-response': {} }
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
                expect(globSyncFn).toHaveBeenCalledWith('**/*.mock.json', { cwd: 'src', root: '/' });
                expect(loadFileFn).toHaveBeenCalledWith(path.join('src', 'mock/minimal-json-request.mock.json'));
                expect(loadFileFn).toHaveBeenCalledWith(path.join('src', 'mock/minimal-binary-request.mock.json'));
                expect(loadFileFn).toHaveBeenCalledWith(path.join('src', 'mock/full-request.mock.json'));
                expect(loadFileFn).toHaveBeenCalledWith(path.join('src', 'mock/duplicate-request.mock.json'));
            });

            it('sets the defaults', () => expect(state.defaults).toEqual({
                'minimal-json-request': {
                    scenario: 'passThrough', echo: false, delay: 0, counter: 0
                },
                'minimal-binary-request': {
                    scenario: 'passThrough', echo: false, delay: 0, counter: 0
                },
                'full-request': {
                    scenario: 'full-response', echo: false, delay: 1000, counter: 0
                }
            }));

            it('sets the global mocks', () => expect(state.global.mocks).toEqual({
                'minimal-json-request': {
                    scenario: 'passThrough', echo: false, delay: 0, counter: 0
                },
                'minimal-binary-request': {
                    scenario: 'passThrough', echo: false, delay: 0, counter: 0
                },
                'full-request': {
                    scenario: 'full-response', echo: false, delay: 1000, counter: 0
                }
            }));

            it('updates the mocks with default values', () => {
                expect(state.mocks[0].responses).toEqual({
                    'duplicate-response': {
                        status: 200, // default is status ok => 200
                        data: {}, // default if isArray is empty of false
                        headers: HttpHeaders.CONTENT_TYPE_APPLICATION_JSON // default if no binary file is specified

                    }
                });
                expect(state.mocks[1].responses).toEqual({
                    'minimal-binary-response': {
                        status: 200, // default is status ok => 200
                        data: {}, // default if isArray is empty of false
                        headers: HttpHeaders.CONTENT_TYPE_BINARY, // default if a binary file is specified
                        file: 'some.pdf'
                    }
                });
                expect(state.mocks[2].responses).toEqual({
                    'full-response': {
                        status: 404,
                        statusText: 'oops',
                        default: true,
                        data: [{ a: 'a' }],
                        headers: { 'Content-type': 'application/something' } // does not add the default headers if specified
                    },
                    'another-full-response': {
                        status: 500,
                        statusText: 'oops',
                        data: [{ a: 'a' }],
                        headers: { 'Content-type': 'application/something' }, // does not add the default headers if specified
                        file: 'some.pdf',
                        default: false
                    }
                });
            });

            it('processes unique mocks', () => {
                expect(debugFn).toHaveBeenCalledTimes(2);
                expect(debugFn).toHaveBeenCalledWith(expect.stringContaining('Mock with identifier \'minimal-json-request\' already exists. Overwriting existing mock.'));
                expect(debugFn).toHaveBeenCalledWith(expect.stringContaining('Processed 3 unique mocks.'));
            });
        });

        describe('with full processing options', () => {
            beforeEach(() => {
                globSyncFn.mockReturnValue([]);
                processor.process({ src: 'src', patterns: { mocks: '**/*.mymock.json' } });
            });
            it('processes each mock', () => {
                expect(globSyncFn).toHaveBeenCalledWith(
                    '**/*.mymock.json', {
                        cwd: 'src', root: '/'
                    }
                );
            });
        });

        describe('with mock watches set', () => {
            beforeEach(() => {
                globSyncFn.mockReturnValue([]);
                processor.process({ src: 'src', patterns: { mocks: '**/*.mymock.json' }, watches: { mocks: '**/*' } });
            });
            it('processes each mock watch and mock pattern', () => {
                expect(globSyncFn).toHaveBeenCalledWith(
                    '**/*', {
                        cwd: 'src', root: '/', nodir: true
                    }
                );
                expect(globSyncFn).toHaveBeenCalledWith(
                    '**/*.mymock.json', {
                        cwd: 'src', root: '/'
                    }
                );
            });
        });
    });
});
