import * as http from 'http';
import {inject, injectable} from 'inversify';

import {State} from '../../../state/state';
import {HttpHeaders, HttpMethods, HttpStatusCode} from '../../http';
import {ApplicableHandler} from '../handler';

/**  Handler for a variables. */
@injectable()
export class SetVariableHandler implements ApplicableHandler {
    /**
     * Constructor.
     * @param {string} baseUrl The base url.
     * @param {State} state The state.
     */
    constructor(@inject('BaseUrl') private baseUrl: string,
                @inject('State') private state: State) {
    }

    /** {@inheritDoc}.*/
    handle(request: http.IncomingMessage, response: http.ServerResponse, next: Function, params: {
        id: string, body: { [key: string]: any }
    }): void {
        const state = this.state.getMatchingState(params.id);
        const body = params.body;
        try {
            if (Object.keys(body).length > 0) {
                Object.keys(body).forEach((key) => {
                    state.variables[key] = body[key];
                });
            } else {
                throw new Error('A variable should have a key and value');
            }
            response.writeHead(HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            response.end();
        } catch (e) {
            response.writeHead(HttpStatusCode.CONFLICT, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            response.end(JSON.stringify(e, ['message']));
        }
    }

    /** {@inheritDoc}.*/
    isApplicable(request: http.IncomingMessage): boolean {
        const methodMatches = request.method === HttpMethods.PUT;
        const urlMatches = request.url.startsWith(`${this.baseUrl}/variables`);
        return urlMatches && methodMatches;
    }
}
