import * as http from 'http';
import {inject, injectable} from 'inversify';

import {State} from '../../../state/state';
import {HttpHeaders, HttpMethods, HttpStatusCode} from '../../http';
import {ApplicableHandler} from '../handler';

/**  Get recordings handler. */
@injectable()
export class GetRecordingsHandler implements ApplicableHandler {
    /**
     * Constructor.
     * @param {string} baseUrl The base url.
     * @param {State} state The state.
     */
    constructor(@inject('BaseUrl') private baseUrl: string,
                @inject('State') private state: State) {
    }

    /** {@inheritDoc}.*/
    handle(request: http.IncomingMessage, response: http.ServerResponse, next: Function, params: { id: string }): void {
        const matchingState = this.state.getMatchingState(params.id);
        const result: any = {
            recordings: matchingState.recordings,
            record: matchingState.record
        };
        response.writeHead(HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
        response.end(JSON.stringify(result));
    }

    /** {@inheritDoc}.*/
    isApplicable(request: http.IncomingMessage): boolean {
        const urlMatches = request.url === `${this.baseUrl}/recordings`;
        const methodMatches = request.method === HttpMethods.GET;
        return urlMatches && methodMatches;
    }
}
