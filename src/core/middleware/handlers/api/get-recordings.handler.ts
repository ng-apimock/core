import * as http from 'http';

import * as debug from 'debug';
import { inject, injectable } from 'inversify';

import { Configuration } from '../../../configuration';
import { State } from '../../../state/state';
import { HttpHeaders, HttpMethods, HttpStatusCode } from '../../http';
import { ApplicableHandler } from '../handler';

export const log = debug('ng-apimock:handler-get-recordings');

/**  Get recordings handler. */
@injectable()
export class GetRecordingsHandler implements ApplicableHandler {
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
        log('Get recordings');
        const matchingState = this.state.getMatchingState(params.id);
        const result: any = {
            recordings: matchingState.recordings,
            record: matchingState.record
        };
        response.writeHead(HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
        response.end(JSON.stringify(result));
    }

    /** {@inheritDoc}. */
    isApplicable(request: http.IncomingMessage): boolean {
        const urlMatches = request.url === `${this.configuration.middleware.basePath}/recordings`;
        const methodMatches = request.method === HttpMethods.GET;
        return urlMatches && methodMatches;
    }
}
