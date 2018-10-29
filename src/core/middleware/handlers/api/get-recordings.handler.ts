import 'reflect-metadata';
import {inject, injectable} from 'inversify';

import * as http from 'http';

import State from '../../../state/state';
import {ApplicableHandler} from '../handler';
import {HttpHeaders, HttpMethods, HttpStatusCode} from '../../http';

/**  Get recordings handler. */
@injectable()
class GetRecordingsHandler implements ApplicableHandler {
    /**
     * Constructor.
     * @param {State} state The state.
     * @param {string} baseUrl The base url.
     */
    constructor(@inject('State') private state: State,
                @inject('BaseUrl') private baseUrl: string) {
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

export default GetRecordingsHandler;
