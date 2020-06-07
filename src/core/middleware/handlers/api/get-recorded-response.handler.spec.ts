import 'reflect-metadata';

import * as fs from 'fs-extra';
import * as http from 'http';
import { Container } from 'inversify';
import * as os from 'os';
import * as path from 'path';

import { HttpHeaders, HttpMethods, HttpStatusCode } from '../../http';

import { GetRecordedResponseHandler } from './get-recorded-response.handler';

jest.mock('fs-extra');

describe('GetRecordedResponseHandler', () => {
    let container: Container;
    let handler: GetRecordedResponseHandler;

    beforeEach(() => {
        container = new Container();

        container.bind('BaseUrl').toConstantValue('/base-url');
        container.bind('GetRecordedResponseHandler').to(GetRecordedResponseHandler);

        handler = container.get<GetRecordedResponseHandler>('GetRecordedResponseHandler');
    });

    describe('handle', () => {
        let fsReadFileSyncFn: jest.Mock;
        let nextFn: jest.Mock;
        let request: http.IncomingMessage;
        let response: http.ServerResponse;

        beforeEach(() => {
            nextFn = jest.fn();
            request = {} as http.IncomingMessage;
            response = {
                end: jest.fn(),
                writeHead: jest.fn()
            } as unknown as http.ServerResponse;

            request.url = 'some/url/to/some.pdf';
            fsReadFileSyncFn = fs.readFileSync as jest.Mock;
            fsReadFileSyncFn.mockReturnValue('file-content');
        });

        it('returns the recorded response', () => {
            handler.handle(request as any, response as any, nextFn);

            expect(fsReadFileSyncFn).toHaveBeenCalledWith(path.join(os.tmpdir(), 'some.pdf'));
            expect(response.writeHead).toHaveBeenCalledWith(HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_BINARY);
            expect(response.end).toHaveBeenCalledWith('file-content');
        });
    });

    describe('isApplicable', () => {
        let request: http.IncomingMessage;

        beforeEach(() => {
            request = {} as http.IncomingMessage;
        });

        it('indicates applicable when url and method match', () => {
            request.url = `${'/base-url'}/recordings/`;
            request.method = HttpMethods.GET;
            expect(handler.isApplicable(request as any)).toBe(true);
        });
        it('indicates not applicable when the method does not match', () => {
            request.url = `${'/base-url'}/recordings/`;
            request.method = HttpMethods.PUT;
            expect(handler.isApplicable(request as any)).toBe(false);
        });
        it('indicates not applicable when the url does not match', () => {
            request.url = `${'/base-url'}/no-match`;
            request.method = HttpMethods.GET;
            expect(handler.isApplicable(request as any)).toBe(false);
        });
    });
});
