import 'reflect-metadata';
import {inject, injectable} from 'inversify';

import * as http from 'http';

import State from '../../../state/state';
import {ApplicableHandler} from '../handler';
import {HttpHeaders, HttpMethods, HttpStatusCode} from '../../http';

/**  Get variables handler. */
@injectable()
class GetVariablesHandler implements ApplicableHandler {
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
        const state = this.state.getMatchingState(params.id);
        const result: any = {
            state: state.variables
        };
        response.writeHead(HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
        response.end(JSON.stringify(result));
    }

    /** {@inheritDoc}.*/
    isApplicable(request: http.IncomingMessage): boolean {
        const methodMatches = request.method === HttpMethods.GET;
        const urlMatches = request.url.startsWith(`${this.baseUrl}/variables`);
        return urlMatches && methodMatches;
    }
}

export default GetVariablesHandler;
