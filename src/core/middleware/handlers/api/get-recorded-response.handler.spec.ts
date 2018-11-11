import 'reflect-metadata';
import {Container} from 'inversify';

import * as fs from 'fs-extra';
import * as http from 'http';
import * as os from 'os';
import * as path from 'path';
import {assert, createStubInstance, SinonStub, SinonStubbedInstance, stub} from 'sinon';

import {HttpHeaders, HttpMethods, HttpStatusCode} from '../../http';
import GetRecordedResponseHandler from './get-recorded-response.handler';

describe('GetRecordedResponseHandler', () => {
    let container: Container;
    let fsReadFileSyncFn: SinonStub;
    let handler: GetRecordedResponseHandler;
    let nextFn: SinonStub;
    let request: SinonStubbedInstance<http.IncomingMessage>;
    let response: SinonStubbedInstance<http.ServerResponse>;

    beforeAll(() => {
        container = new Container();
        fsReadFileSyncFn = stub(fs, 'readFileSync');
        nextFn = stub();
        request = createStubInstance(http.IncomingMessage);
        request.url = 'some/url/to/some.pdf';
        response = createStubInstance(http.ServerResponse);

        container.bind('BaseUrl').toConstantValue('/base-url');
        container.bind('GetRecordedResponseHandler').to(GetRecordedResponseHandler);

        handler = container.get<GetRecordedResponseHandler>('GetRecordedResponseHandler');
    });

    describe('handle', () =>
        it('returns the recorded response', () => {
            handler.handle(request as any, response, nextFn);

            assert.calledWith(fsReadFileSyncFn, path.join(os.tmpdir(), 'some.pdf'));
            assert.calledWith(response.writeHead, HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_BINARY);
            assert.called(response.end);
        }));

    describe('isApplicable', () => {
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

    afterAll(() => {
        fsReadFileSyncFn.restore();
    });
});