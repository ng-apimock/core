import * as fs from 'fs-extra';
import * as http from 'http';
import * as os from 'os';
import * as path from 'path';
import {assert, createStubInstance, SinonStub, SinonStubbedInstance, stub} from 'sinon';
import {Container} from 'inversify';
import {GetRecordedResponseHandler} from './get-recorded-response.handler';
import {HttpHeaders, HttpMethods, HttpStatusCode} from '../../http';

describe('GetRecordedResponseHandler', () => {
    let container: Container;
    let fsReadFileSyncFn: SinonStub;
    let handler: GetRecordedResponseHandler;

    beforeEach(() => {
        container = new Container();

        container.bind('BaseUrl').toConstantValue('/base-url');
        container.bind('GetRecordedResponseHandler').to(GetRecordedResponseHandler);

        handler = container.get<GetRecordedResponseHandler>('GetRecordedResponseHandler');
    });

    describe('handle', () => {
        let nextFn: SinonStub;
        let request: SinonStubbedInstance<http.IncomingMessage>;
        let response: SinonStubbedInstance<http.ServerResponse>;

        beforeEach(() => {
            nextFn = stub();
            request = createStubInstance(http.IncomingMessage);
            response = createStubInstance(http.ServerResponse);

            request.url = 'some/url/to/some.pdf';
            fsReadFileSyncFn = stub(fs, 'readFileSync');
            fsReadFileSyncFn.returns('file-content');
        });

        afterEach(()=> {
            fsReadFileSyncFn.restore();
        });

        it('returns the recorded response', () => {
            handler.handle(request as any, response as any, nextFn);

            assert.calledWith(fsReadFileSyncFn, path.join(os.tmpdir(), 'some.pdf'));
            assert.calledWith(response.writeHead, HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_BINARY);
            // @ts-ignore
            assert.calledWith(response.end, 'file-content');
        });
    });

    describe('isApplicable', () => {
        let request: SinonStubbedInstance<http.IncomingMessage>;

        beforeEach(() => {
            request = createStubInstance(http.IncomingMessage);
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
