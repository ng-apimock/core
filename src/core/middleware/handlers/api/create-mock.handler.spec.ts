import * as http from 'http';
import * as path from 'path';

import * as debug from 'debug';
import * as fs from 'fs-extra';
import { Container } from 'inversify';
import { createSpyObj } from 'jest-createspyobj';

import { Mock } from '../../../mock/mock';
import { State } from '../../../state/state';
import { HttpHeaders, HttpMethods } from '../../http';
import { HandlerUtils } from '../handerutil';

import { CreateMockHandler } from './create-mock.handler';

jest.mock('fs-extra');
describe('CreateMocksHandler', () => {
    let container: Container;
    let handler: CreateMockHandler;
    let state: jest.Mocked<State>;

    beforeEach(() => {
        container = new Container();
        state = createSpyObj(State);
        container.bind('Configuration').toConstantValue({ middleware: { basePath: '/base-path' } });
        container.bind('CreateMockHandler').to(CreateMockHandler);
        container.bind('State').toConstantValue(state);
        handler = container.get<CreateMockHandler>('CreateMockHandler');
    });

    describe('handle', () => {
        let debugFn: jest.SpyInstance;
        let nextFn: jest.Mock;
        let request: http.IncomingMessage;
        let response: http.ServerResponse;

        beforeEach(() => {
            handler.saveMock = jest.fn();

            debug.enable('ng-apimock:handler-create-mock');
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

        it('should throw if the incoming request is not if the type Mock', () => {
            handler.handle(request as any, response as any, nextFn, {
                id: 'someId',
                body: {
                    name: 'valid',
                    request: {}
                } as unknown as Mock
            });
            expect(response.writeHead).toHaveBeenCalledWith(409, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
        });
        it('should throw if the mock already exists', () => {
            HandlerUtils.checkIfMockExists = jest.fn().mockReturnValue(true);
            handler.handle(request as any, response as any, nextFn, {
                id: 'someId',
                body: {
                    name: 'valid',
                    request: {},
                    responses: {}
                } as unknown as Mock
            });
            expect(debugFn).toHaveBeenCalledTimes(1);
            expect(debugFn).toHaveBeenCalledWith(expect.stringContaining('Mock with name: [valid] already exists'));
            expect(response.writeHead).toHaveBeenCalledWith(409, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            expect(response.end).toHaveBeenCalledWith(JSON.stringify({ message: 'Mock with name: [valid] already exists' }));
        });
        it('should save the mock is the the mock is valid and does not yet exist', () => {
            handler.saveMock = jest.fn();
            HandlerUtils.checkIfMockExists = jest.fn().mockReturnValue(false);
            handler.handle(request as any, response as any, nextFn, {
                id: 'someId',
                body: {
                    name: 'valid',
                    request: {},
                    responses: {}
                } as unknown as Mock
            });
            expect(debugFn).toHaveBeenCalledTimes(1);
            expect(debugFn).toHaveBeenCalledWith(expect.stringContaining('Created mock [valid]'));
            expect(handler.saveMock).toHaveBeenCalled();
        });
    });

    describe('saveMock', () => {
        let outputJSONSync: jest.Mock;
        let mockPostData: Mock;
        beforeEach(() => {
            outputJSONSync = fs.outputJSONSync as jest.Mock;
            state.getProcessingOptions.mockReturnValue({
                src: 'the/mocks/path',
                patterns: {
                    mocks: '**/*.somemock.json'
                }
            });
            mockPostData = {
                name: 'newname',
                request: {
                    url: 'url',
                    method: 'GET'
                },
                responses: {
                    someResponse: {
                        default: true,
                        data: {}
                    }
                }
            };
        });
        it('shoud save the mock in the mocks folder', () => {
            handler.saveMock(mockPostData);
            expect(outputJSONSync).toHaveBeenCalledWith(path.join('the/mocks/path', 'newname.somemock.json'), mockPostData, { spaces: 2 });
        });
        it('should add a default response if no reponse is posted and save the mock', () => {
            mockPostData.responses = {};
            handler.saveMock(mockPostData);
            const expectedPostData = {
                ...mockPostData,
                responses: {
                    createdDefault: {
                        status: 501,
                        data: {},
                        default: true
                    }
                }
            };
            expect(outputJSONSync).toHaveBeenCalledWith(path.join('the/mocks/path', 'newname.somemock.json'),
                expectedPostData, { spaces: 2 });
        });
    });

    describe('isApplicable', () => {
        let request: http.IncomingMessage;

        beforeEach(() => {
            request = {} as http.IncomingMessage;
        });

        it('indicates applicable when url and method match', () => {
            request.url = '/base-path/mocks';
            request.method = HttpMethods.POST;
            expect(handler.isApplicable(request as any)).toBe(true);
        });
        it('indicates not applicable when the method does not match', () => {
            request.url = '/base-path/mocks';
            request.method = HttpMethods.PUT;
            expect(handler.isApplicable(request as any)).toBe(false);
        });
    });
});
