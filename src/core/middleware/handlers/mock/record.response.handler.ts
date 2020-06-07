import * as fs from 'fs-extra';
import * as http from 'http';
import { inject, injectable } from 'inversify';
import fetch, { Request } from 'node-fetch';
import * as os from 'os';
import * as path from 'path';
import * as uuid from 'uuid';

import { Mock } from '../../../mock/mock';
import { Recording } from '../../../state/recording';
import { State } from '../../../state/state';
import { HttpMethods } from '../../http';
import { Handler } from '../handler';

/**  Handler for a recording a response. */
@injectable()
export class RecordResponseHandler implements Handler {
    APPLICABLE_MIMETYPES = ['application/json', 'application/xml'];
    RESPONSE_ENCODING = 'base64';

    /**
     * Constructor.
     * @param {string} baseUrl The base url.
     * @param {State} state The state.
     */
    constructor(@inject('BaseUrl') private baseUrl: string,
                @inject('State') private state: State) {
    }

    /** {@inheritDoc}. */
    async handle(request: http.IncomingMessage, response: http.ServerResponse, next: Function, params: { id: string, mock: Mock, body: any }): Promise<any> {
        const { method } = request;
        const { headers } = request;

        headers.record = 'true';

        const requestInit: any = {
            method,
            headers: headers as HeadersInit
        };

        if ([HttpMethods.GET, HttpMethods.DELETE].indexOf(request.method) === -1) {
            requestInit.body = JSON.stringify(params.body);
        }

        try {
            const res = await this.fetchResponse(new Request(`http://${headers.host}${request.url}`, requestInit));
            const responseData = await res.buffer();
            const responseHeaders = await res.headers.raw();
            const responseStatusCode = res.status;

            const recording: any = {
                request: {
                    url: request.url,
                    method: request.method,
                    headers: request.headers,
                    body: params.body
                },
                response: {
                    data: responseData,
                    status: responseStatusCode,
                    headers: responseHeaders,
                    contentType: res.headers.get('content-type')
                },
                datetime: new Date().getTime()
            };

            this.record(params.id, params.mock.name, recording);

            response.writeHead(responseStatusCode, responseHeaders);
            response.end(responseData);
        } catch (err) {
            response.end(err.message);
        }
    }

    /**
     * Fetch the request.
     * @param {Request} request The request.
     * @return {Promise<any>} promise The promise.
     */
    fetchResponse(request: Request): Promise<any> {
        return fetch(request);
    }

    /**
     * Stores the recording with the matching mock.
     * @param {string} id The identifier.
     * @param {string} name The name.
     * @param {Recording} recording The recordings.
     */
    record(id: string, name: string, recording: Recording): void {
        const { contentType } = recording.response;
        const { recordings } = this.state.getMatchingState(id);
        if (recordings[name] === undefined) {
            recordings[name] = [];
        }

        if (this.APPLICABLE_MIMETYPES.indexOf(contentType) === -1) {
            const destination = `${uuid.v4()}.${contentType.substring(contentType.indexOf('/') + 1)}`;
            fs.writeFileSync(path.join(os.tmpdir(), destination), Buffer.from((recording.response.data as any).toString(this.RESPONSE_ENCODING), this.RESPONSE_ENCODING as any));
            recording.response.data = JSON.stringify({ apimockFileLocation: `${this.baseUrl}/recordings/${destination}` });
        } else {
            recording.response.data = recording.response.data.toString();
        }
        recordings[name].push(recording);
    }
}
