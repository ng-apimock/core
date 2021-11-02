import 'reflect-metadata';

import * as http from 'http';

import * as debug from 'debug';
import { Container } from 'inversify';

import { InstanceHolder } from '../../../instance.holder';
import { HttpHeaders, HttpMethods, HttpStatusCode } from '../../http';

import { HealthHandler } from './health.handler';

describe('HealthHandler', () => {
    let container: Container;
    let handler: HealthHandler;
    let state: jest.Mocked<InstanceHolder>;

    beforeEach(() => {
        container = new Container();

        container.bind('Configuration').toConstantValue({ middleware: { basePath: '/base-path' } });
        container.bind('HealthHandler').to(HealthHandler);

        handler = container.get<HealthHandler>('HealthHandler');
    });

    describe('handle', () => {
        let debugFn: jest.SpyInstance;
        let nextFn: jest.Mock;
        let request: http.IncomingMessage;
        let response: http.ServerResponse;

        beforeEach(() => {
            debug.enable('ng-apimock:handler-health');
            debugFn = jest.spyOn(process.stderr, 'write');

            nextFn = jest.fn();
            response = {
                end: jest.fn(),
                writeHead: jest.fn()
            } as unknown as http.ServerResponse;
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        describe('/health', () => {
            beforeEach(() => {
                request = {
                    url: '/health'
                } as http.IncomingMessage;
            });

            it('ends the response', () => {
                handler.handle(request as any, response as any, nextFn, { id: 'apimockId' });

                expect(debugFn).toHaveBeenCalledTimes(1);
                expect(debugFn).toHaveBeenCalledWith(expect.stringContaining('Health'));
                expect(response.writeHead).toHaveBeenCalledWith(HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
                expect(response.end).toHaveBeenCalledWith('{"status":"UP","components":{"livenessState":{"status":"UP"},"ping":{"status":"UP"},"readinessState":{"status":"UP"},"refreshScope":{"status":"UP"}},"groups":["liveness","readiness"]}');
            });
        });
        describe('/health/liveness', () => {
            beforeEach(() => {
                request = {
                    url: '/health/liveness'
                } as http.IncomingMessage;
            });

            it('ends the response', () => {
                handler.handle(request as any, response as any, nextFn, { id: 'apimockId' });

                expect(debugFn).toHaveBeenCalledTimes(1);
                expect(debugFn).toHaveBeenCalledWith(expect.stringContaining('Health'));
                expect(response.writeHead).toHaveBeenCalledWith(HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
                expect(response.end).toHaveBeenCalledWith('{"status":"UP","components":{"refreshScope":{"status":"UP"}}}');
            });
        });
        describe('/health/readiness', () => {
            beforeEach(() => {
                request = {
                    url: '/health/readiness'
                } as http.IncomingMessage;
            });

            it('ends the response', () => {
                handler.handle(request as any, response as any, nextFn, { id: 'apimockId' });

                expect(debugFn).toHaveBeenCalledTimes(1);
                expect(debugFn).toHaveBeenCalledWith(expect.stringContaining('Health'));
                expect(response.writeHead).toHaveBeenCalledWith(HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
                expect(response.end).toHaveBeenCalledWith('{"status":"UP","components":{"refreshScope":{"status":"UP"}}}');
            });
        });
    });

    describe('isApplicable', () => {
        let request: http.IncomingMessage;

        beforeEach(() => {
            request = {} as http.IncomingMessage;
        });

        it('indicates applicable when url and action match', () => {
            request.url = '/base-path/health';
            request.method = HttpMethods.GET;
            expect(handler.isApplicable(request as any)).toBe(true);
        });
        it('indicates not applicable when the action does not match', () => {
            request.url = '/base-path/health';
            request.method = HttpMethods.PUT;
            expect(handler.isApplicable(request as any)).toBe(false);
        });
        it('indicates not applicable when the url does not match', () => {
            request.url = '/base-path/no-match';
            request.method = HttpMethods.GET;
            expect(handler.isApplicable(request as any)).toBe(false);
        });
    });
});
