import * as http from 'http';

import * as debug from 'debug';
import { Container } from 'inversify';
import { createSpyObj } from 'jest-createspyobj';

import { InstanceHolder } from '../../../instance.holder';
import { HttpHeaders, HttpMethods, HttpStatusCode } from '../../http';

import { InformationHandler } from './information.handler';

describe('InformationHandler', () => {
    let container: Container;
    let handler: InformationHandler;
    let instanceHolder: jest.Mocked<InstanceHolder>;

    beforeEach(() => {
        container = new Container();
        instanceHolder = createSpyObj(InstanceHolder);

        container.bind('Configuration').toConstantValue({ middleware: { basePath: '/base-path' } });
        container.bind('InstanceHolder').toConstantValue(instanceHolder);
        container.bind('InformationHandler').to(InformationHandler);

        handler = container.get<InformationHandler>('InformationHandler');
    });

    describe('handle', () => {
        let debugFn: jest.SpyInstance;
        let nextFn: jest.Mock;
        let request: http.IncomingMessage;
        let response: http.ServerResponse;

        beforeEach(() => {
            debug.enable('ng-apimock:handler-information');
            debugFn = jest.spyOn(process.stderr, 'write');

            nextFn = jest.fn();
            request = {} as http.IncomingMessage;
            response = {
                end: jest.fn(),
                writeHead: jest.fn()
            } as unknown as http.ServerResponse;

            instanceHolder.getInformation.mockReturnValue({ the: 'information' });
        });

        it('ends the response', () => {
            handler.handle(request as any, response as any, nextFn, { id: 'apimockId' });

            expect(debugFn).toHaveBeenCalledTimes(1);
            expect(debugFn).toHaveBeenCalledWith(expect.stringContaining('Information'));
            expect(response.writeHead).toHaveBeenCalledWith(HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            expect(response.end).toHaveBeenCalledWith('{"the":"information"}');
        });
    });

    describe('isApplicable', () => {
        let request: http.IncomingMessage;

        beforeEach(() => {
            request = {} as http.IncomingMessage;
        });

        it('indicates applicable when url and action match', () => {
            request.url = '/base-path/info';
            request.method = HttpMethods.GET;
            expect(handler.isApplicable(request as any)).toBe(true);
        });
        it('indicates not applicable when the action does not match', () => {
            request.url = '/base-path/info';
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
