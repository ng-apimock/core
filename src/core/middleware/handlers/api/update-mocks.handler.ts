import * as http from 'http';
import {inject, injectable} from 'inversify';

import {Mock} from '../../../mock/mock';
import {State} from '../../../state/state';
import {HttpHeaders, HttpMethods, HttpStatusCode} from '../../http';
import {ApplicableHandler} from '../handler';

/**  Update mocks handler. */
@injectable()
export class UpdateMocksHandler implements ApplicableHandler {
    private PASS_THROUGH = 'passThrough';

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
        id: string, body: { name: string, scenario?: string, echo?: boolean, delay?: number }
    }): void {
        const state = this.state.getMatchingState(params.id);
        const body = params.body;
        try {
            const mockName: string = body.name;
            const matchingMock: Mock = this.state.mocks.find((mock) => mock.name === mockName);

            if (matchingMock !== undefined) {
                const scenario: string = body.scenario;
                const echo: boolean = body.echo;
                const delay: number = body.delay;

                if (echo !== undefined) {
                    state.mocks[mockName].echo = echo;
                }
                if (delay !== undefined) {
                    state.mocks[mockName].delay = delay;
                }

                if (scenario !== undefined) {
                    if (scenario === this.PASS_THROUGH ||
                        Object.keys(matchingMock.responses).find((_scenario) => _scenario === scenario)) {
                        state.mocks[mockName].scenario = scenario;
                    } else {
                        throw new Error(`No scenario matching ['${scenario}'] found`);
                    }
                }
            } else {
                throw new Error(`No mock matching name ['${mockName}'] found`);
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
        const urlMatches = request.url.startsWith(`${this.baseUrl}/mocks`);
        return urlMatches && methodMatches;
    }
}
