import * as http from 'http';

import { inject, injectable } from 'inversify';

import { State } from '../../../state/state';
import { HttpHeaders, HttpMethods, HttpStatusCode } from '../../http';
import { ApplicableHandler } from '../handler';

/**  Init handler. */
@injectable()
export class InitHandler implements ApplicableHandler {
    /**
     * Constructor.
     * @param {string} baseUrl The base url.
     * @param {State} state The state.
     */
    constructor(@inject('BaseUrl') private baseUrl: string,
                @inject('State') private state: State) {
    }

    /** {@inheritDoc}. */
    handle(request: http.IncomingMessage, response: http.ServerResponse, next: Function, params: { id: string }): void {
        response.writeHead(HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
        response.end();
    }

    /** {@inheritDoc}. */
    isApplicable(request: http.IncomingMessage): boolean {
        const urlMatches = request.url.startsWith(`${this.baseUrl}/init`);
        const methodMatches = request.method === HttpMethods.GET;
        return urlMatches && methodMatches;
    }
}
