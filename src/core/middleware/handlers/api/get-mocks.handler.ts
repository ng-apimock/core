import * as http from 'http';

import { inject, injectable } from 'inversify';

import { State } from '../../../state/state';
import { HttpHeaders, HttpMethods, HttpStatusCode } from '../../http';
import { ApplicableHandler } from '../handler';

/**  Get mocks handler. */
@injectable()
export class GetMocksHandler implements ApplicableHandler {
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
        const state = this.state.getMatchingState(params.id);
        const result: any = {
            state: state.mocks,
            mocks: this.state.mocks
                .map((mock) => ({
                    name: mock.name, request: mock.request, responses: Object.keys(mock.responses)
                }))
        };
        response.writeHead(HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
        response.end(JSON.stringify(result));
    }

    /** {@inheritDoc}. */
    isApplicable(request: http.IncomingMessage): boolean {
        const urlMatches = request.url.startsWith(`${this.baseUrl}/mocks`);
        const methodMatches = request.method === HttpMethods.GET;
        return urlMatches && methodMatches;
    }
}
