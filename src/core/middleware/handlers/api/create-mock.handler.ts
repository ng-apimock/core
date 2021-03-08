import * as http from 'http';
import * as path from 'path';

import * as fs from 'fs-extra';
import { inject, injectable } from 'inversify';

import { Configuration } from '../../../configuration';
import { Mock } from '../../../mock/mock';
import { MockResponse } from '../../../mock/mock.response';
import { State } from '../../../state/state';
import { HttpHeaders, HttpMethods, HttpStatusCode } from '../../http';
import { ApplicableHandler } from '../handler';

/**  Handler for creating and saving mocks in the mocks directory. */
@injectable()
export class CreateMockHandler implements ApplicableHandler {
    MOCK_EXTENTIONS = {
        JSON: 'mock.json',
        SCRIPT: 'mock.js'
    }
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
                if (this.checkIfMockExists(body.name)) {
                    throw new Error('this mock already exists');
                }
                this.saveMock(body);
            } else {
                throw new Error('a new mock should have a name, request and response');
            }
            response.writeHead(HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            response.end('mock created');
        } catch (e) {
            response.writeHead(HttpStatusCode.CONFLICT, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            response.end(JSON.stringify(e, ['message']));
        }
    }

    saveMock(mock: Mock) {
        const processConfig = this.state.getProcessingOptions();
        if (Object.keys(mock.responses).length === 0) {
            const defaultResponse: MockResponse = {
                status: 501,
                data: {},
                default: true
            };
            mock.responses['createdDefault'] = defaultResponse;
        }
        fs.outputJSONSync(path.join(processConfig.src, `${mock.name}.${this.MOCK_EXTENTIONS.JSON}`), mock, { spaces: 2 });
    }

    checkIfMockExists(mockName: string): boolean {
        const mocknames: string[] = this.state.mocks.map((mock) => mock.name);
        return !!mocknames.find((elName) => elName === mockName);
    }

    /** {@inheritDoc}. */
    isApplicable(request: http.IncomingMessage): boolean {
        const methodMatches = request.method === HttpMethods.POST;
        const urlMatches = request.url.startsWith(`${this.configuration.middleware.basePath}/mocks`);
        return urlMatches && methodMatches;
    }
}
