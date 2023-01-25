import * as http from 'http';

import { debug } from 'debug';
import { inject, injectable } from 'inversify';

import { Configuration } from '../../../configuration';
import { State } from '../../../state/state';
import { HttpHeaders, HttpMethods, HttpStatusCode } from '../../http';
import { ApplicableHandler } from '../handler';

export const log = debug('ng-apimock:handler-state');

/**  State handler. */
@injectable()
export class StateHandler implements ApplicableHandler {
    /**
     * Constructor.
     * @param {Configuration} configuration The configuration.
     * @param {State} state The state.
     */
    constructor(@inject('Configuration') private configuration: Configuration,
                @inject('State') private state: State) {
    }

    /** {@inheritDoc}. */
    handle(request: http.IncomingMessage, response: http.ServerResponse, next: Function, params: { id: string }): void {
        log('State');
        const responseObject = {
            global: this.state.global,
            sessions: this.state.sessions
        };

        response.writeHead(HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
        response.end(JSON.stringify(responseObject));
    }

    /** {@inheritDoc}. */
    isApplicable(request: http.IncomingMessage): boolean {
        const methodMatches = request.method === HttpMethods.GET;
        const urlMatches = request.url.startsWith(`${this.configuration.middleware.basePath}/state`);
        return urlMatches && methodMatches;
    }
}
