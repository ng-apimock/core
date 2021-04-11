import * as http from 'http';
import * as os from 'os';
import * as path from 'path';

import * as debug from 'debug';
import * as fs from 'fs-extra';
import { inject, injectable } from 'inversify';

import { Configuration } from '../../../configuration';
import { HttpHeaders, HttpMethods, HttpStatusCode } from '../../http';
import { ApplicableHandler } from '../handler';

export const log = debug('ng-apimock:handler-get-recorded-response');

/**  Handler for a recording a response. */
@injectable()
export class GetRecordedResponseHandler implements ApplicableHandler {
    /**
     * Constructor.
     * @param {Configuration} configuration The configuration.
     */
    constructor(@inject('Configuration') private configuration: Configuration) {
    }

    /** {@inheritDoc}. */
    handle(request: http.IncomingMessage, response: http.ServerResponse, next: Function): void {
        const fileName = request.url.substring(request.url.lastIndexOf('/') + 1);
        log(`Get recorded response: [${fileName}]`);
        const file = fs.readFileSync(path.join(os.tmpdir(), fileName));
        response.writeHead(HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_BINARY);
        response.end(file);
    }

    /** {@inheritDoc}. */
    isApplicable(request: http.IncomingMessage): boolean {
        const methodMatches = request.method === HttpMethods.GET;
        const urlMatches = request.url.startsWith(`${this.configuration.middleware.basePath}/recordings/`);
        return urlMatches && methodMatches;
    }
}
