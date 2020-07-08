import * as http from 'http';
import * as os from 'os';
import * as path from 'path';

import * as fs from 'fs-extra';
import { inject, injectable } from 'inversify';

import { Configuration } from '../../../configuration';
import { State } from '../../../state/state';
import { HttpHeaders, HttpMethods, HttpStatusCode } from '../../http';
import { ApplicableHandler } from '../handler';

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
