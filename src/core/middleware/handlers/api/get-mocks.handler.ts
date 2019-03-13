import 'reflect-metadata';
import {inject, injectable} from 'inversify';

import * as http from 'http';

import {State} from '../../../state/state';
import {ApplicableHandler} from '../handler';
import {HttpHeaders, HttpMethods, HttpStatusCode} from '../../http';

/**  Get mocks handler. */
@injectable()
export class GetMocksHandler implements ApplicableHandler {
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
            state: state.mocks,
            mocks: this.state.mocks.map((mock) => ({
                name: mock.name,
                request: mock.request,
                responses: Object.keys(mock.responses)
            }))
        };
        response.writeHead(HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
        response.end(JSON.stringify(result));
    }

    /** {@inheritDoc}.*/
    isApplicable(request: http.IncomingMessage): boolean {
        const urlMatches = request.url.startsWith(`${this.baseUrl}/mocks`);
        const methodMatches = request.method === HttpMethods.GET;
        return urlMatches && methodMatches;
    }
}
