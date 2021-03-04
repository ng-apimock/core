import * as http from 'http';

import { inject, injectable } from 'inversify';

import { Configuration } from '../../../configuration';
import { State } from '../../../state/state';
import { HttpHeaders, HttpMethods, HttpStatusCode } from '../../http';
import { ApplicableHandler } from '../handler';
import * as path from 'path';

import * as fs from 'fs-extra';
import { MockResponse } from '../../../mock/mock.response';
import { Mock } from '../../../mock/mock';

export interface PostedMock {
	name: string;
	method: 'POST' | 'GET' | 'PUT' | 'OPTIONS',
	url: string;
	responses: { [key: string]: MockResponse }
}
/**  Handler for creating and saving mocks in the mocks directory. */
@injectable()
export class CreateMockHandler implements ApplicableHandler {
	APPLICABLE_MIMETYPES = ['application/json', 'application/xml'];
    RESPONSE_ENCODING = 'base64';
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
                @inject('State') private state: State) {
    }

    /** {@inheritDoc}. */
    handle(request: http.IncomingMessage, response: http.ServerResponse, next: Function, params: {
        id: string, body: Mock
    }): void {
        // const state = this.state.getMatchingState(params.name);
        const { body } = params;
        console.log('params', params);
        // no try to write to disc!
        try {
            if (body.name && body.request && body.responses) {
				if(this.checkIfMockExists(body)) {
                    throw new Error('this mock already exissts');
                }
               
                console.log('now save stuff');
				this.saveMock(body);
                
            } else {
                throw new Error('a new mock should have a name or an expression and a response');
            }
            response.writeHead(HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            response.end('mock created');
        } catch (e) {
            response.writeHead(HttpStatusCode.CONFLICT, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            response.end(JSON.stringify(e, ['message']));
        }
    }

    saveMock(mock: Mock) {
		const processConfig = this.state._processorConfiguration;
		if (Object.keys(mock.responses).length === 0) {
			const defaultResponse: MockResponse = {
				status: 409,
				data: {},
				default: true,
				statusText: 'no response posted'
			};
			mock.responses['createdDetault'] = defaultResponse;
		}
		fs.writeFileSync(path.join(processConfig.src, `${mock.name}.${this.MOCK_EXTENTIONS.JSON}`), JSON.stringify(mock));
    }

    checkIfMockExists(requestBody: any): boolean {
        // implement me
        return false;
    }

    /** {@inheritDoc}. */
    isApplicable(request: http.IncomingMessage): boolean {
        const methodMatches = request.method === HttpMethods.POST;
        const urlMatches = request.url.startsWith(`${this.configuration.middleware.basePath}/create-mock`);
        return urlMatches && methodMatches;
    }
}
