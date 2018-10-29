import 'reflect-metadata';
import {inject, injectable} from 'inversify';

import * as http from 'http';

import Mock from '../../../mock/mock';
import State from '../../../state/state';
import {Handler} from '../handler';

/**  Handler for a echoing a request. */
@injectable()
class EchoRequestHandler implements Handler {
    /**
     * Constructor.
     * @param {State} state The state.
     */
    constructor(@inject('State') private state: State) {
    }

    /** {@inheritDoc}.*/
    handle(request: http.IncomingMessage, response: http.ServerResponse, next: Function,
           params: { id: string, mock: Mock, body: any }): void {
        const echo: boolean = this.state.getEcho(params.mock.name, params.id);

        if (echo) {
            console.log(`${params.mock.request.method} request made on '${params.mock.request.url}' with body: '${JSON.stringify(params.body)}`);
        }
    }
}

export default EchoRequestHandler;
