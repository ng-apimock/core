import * as http from 'http';
import * as path from 'path';

import * as debug from 'debug';
import * as fs from 'fs-extra';
import { inject, injectable } from 'inversify';

import { Configuration } from '../../../configuration';
import { Mock } from '../../../mock/mock';
import { MockResponse } from '../../../mock/mock.response';
import { State } from '../../../state/state';
import { HttpHeaders, HttpMethods, HttpStatusCode } from '../../http';
import { HandlerUtils } from '../handerutil';
import { ApplicableHandler } from '../handler';

export const log = debug('ng-apimock:handler-create-mock');

/**  Handler for creating and saving mocks in the mocks directory. */
@injectable()
export class CreateMockHandler implements ApplicableHandler {
    /**
     * Constructor.
     * @param {Configuration} configuration The configuration.
     * @param {State} state The state.
     */
    constructor(@inject('Configuration') private configuration: Configuration,
                @inject('State') private state: State) {}

    /** {@inheritDoc}. */
    handle(request: http.IncomingMessage, response: http.ServerResponse, next: Function, params: {
        id: string, body: Mock
    }): void {
        const { body } = params;
        // no try to write to disc!
        try {
            if (body.name && body.request && body.responses) {
                if (HandlerUtils.checkIfMockExists(this.state, body.name)) {
                    throw new Error(`Mock with name: [${body.name}] already exists`);
                }
                this.saveMock(body);
            } else {
                throw new Error('A new mock should have a name, request and response');
            }
            const message = `Created mock [${body.name}]`;
            log(message);
            response.writeHead(HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            response.end(message);
        } catch (e) {
            log(e.message);
            response.writeHead(HttpStatusCode.CONFLICT, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            response.end(JSON.stringify(e, ['message']));
        }
    }

    saveMock(mock: Mock) {
        const processConfig = this.state.getProcessingOptions();
        const mocksConfig = processConfig.patterns.mocks;
        const mockExtention = mocksConfig.substring(mocksConfig.lastIndexOf('*') + 1).replace(/^\./, '');
        if (Object.keys(mock.responses).length === 0) {
            const defaultResponse: MockResponse = {
                status: 501,
                data: {},
                default: true
            };
            mock.responses['createdDefault'] = defaultResponse;
        }
        fs.outputJSONSync(path.join(processConfig.src, `${mock.name}.${mockExtention}`), mock, { spaces: 2 });
    }

    /** {@inheritDoc}. */
    isApplicable(request: http.IncomingMessage): boolean {
        const methodMatches = request.method === HttpMethods.POST;
        const urlMatches = request.url.startsWith(`${this.configuration.middleware.basePath}/mocks`);
        return urlMatches && methodMatches;
    }
}
