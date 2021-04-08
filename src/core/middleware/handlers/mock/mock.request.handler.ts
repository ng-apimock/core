import * as http from 'http';
import * as path from 'path';
import * as url from 'url';

import * as fs from 'fs-extra';
import { inject, injectable } from 'inversify';

import { Mock } from '../../../mock/mock';
import { MockResponse } from '../../../mock/mock.response';
import {
    MockResponseThenClause,
    MockResponseThenClauseCriteria
} from '../../../mock/mock.response.then.clause';
import { IState } from '../../../state/Istate';
import { MockState } from '../../../state/mock.state';
import { State } from '../../../state/state';
import { HttpHeaders, HttpStatusCode } from '../../http';
import { Handler } from '../handler';

/**  Handler for a mock request. */
@injectable()
export class MockRequestHandler implements Handler {
    /**
     * Constructor.
     * @param {State} state The state.
     */
    constructor(@inject('State') private state: State) {
    }

    /** {@inheritDoc}. */
    handle(request: http.IncomingMessage, response: http.ServerResponse, next: Function, params: { id: string, mock: Mock }): void {
        const _response: MockResponse = this.state.getResponse(params.mock.name, params.id);
        if (_response !== undefined) {
            const { headers } = _response;
            const { status } = _response;
            const { then } = _response;
            const delay: number = this.state.getDelay(params.mock.name, params.id);
            const jsonCallbackName = this.getJsonCallbackName(request);

            try {
                const chunk = this.getChunk(_response, params, jsonCallbackName);

                setTimeout(() => {
                    this.respond(params, then, response, status, headers, chunk);
                }, delay);
            } catch (e) {
                response.writeHead(HttpStatusCode.INTERNAL_SERVER_ERROR, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
                response.end(JSON.stringify(e, ['message']));
                console.log(JSON.stringify(e, ['message']));
            }
        } else {
            next();
        }
    }

    /**
     * Gets the chunk for the given response.
     * @param {MockResponse} _response The Mock response.
     * @param {Object} params The parameters.
     * @param {string | boolean} jsonCallbackName The json callback name.
     * @return {Buffer | string} chunk The chunk.
     */
    private getChunk(_response: MockResponse, params: { id: string; mock: Mock }, jsonCallbackName: string | boolean): Buffer | string {
        let chunk: Buffer | string;
        if (this.isBinaryResponse(_response)) {
            chunk = fs.readFileSync(path.join(params.mock.path, _response.file));
        } else {
            const _variables: any = this.state.getVariables(params.id);
            const data = this.isJsonResponse(_response) ? JSON.stringify(_response.data) : _response.data;
            chunk = this.interpolateResponseData(data, _variables);
        }

        if (jsonCallbackName !== false) {
            chunk = `${jsonCallbackName}(${chunk})`;
        }
        return chunk;
    }

    /**
     * Get the JSONP callback name.
     * @param request The request.
     * @returns {string|boolean} callbackName Either the name or false.
     */
    private getJsonCallbackName(request: http.IncomingMessage): string | boolean {
        const parsedUrl = url.parse(request.url, true);
        return !parsedUrl.query || !parsedUrl.query.callback
            ? false
            : parsedUrl.query.callback as string;
    }

    /**
     * Update the response data with the globally available variables.
     * @param data The data.
     * @param variables The variables.
     * @return updatedData The updated data.
     */
    private interpolateResponseData(data: any, variables: { [key: string]: any }): string {
        let _data = data;

        Object.keys(variables).forEach((key) => {
            if (variables.hasOwnProperty(key)) {
                if (typeof variables[key] === 'string') {
                    _data = _data.replace(new RegExp(`%%${key}%%`, 'g'), variables[key]);
                } else {
                    // 1. replace object assignments ie. "x": "%%my-key%%"
                    _data = _data.replace(new RegExp(`"%%${key}%%"`, 'g'), variables[key]);
                    // 2. replace within a string ie. "x": "the following text %%my-key%% is replaced
                    _data = _data.replace(new RegExp(`%%${key}%%`, 'g'), variables[key]);
                }
            }
        });
        return _data;
    }

    /**
     * Indicates if the given response is a binary response.
     * @param response The response
     * @return {boolean} indicator The indicator.
     */
    private isBinaryResponse(response: MockResponse): boolean {
        return response.file !== undefined;
    }

    /**
     Indicates if the given response is a json response.
     * @param response The response
     * @return {boolean} indicator The indicator.
     */
    private isJsonResponse(response: MockResponse): boolean {
        return !response.headers['Content-type'] // default json
            || response.headers['Content-type'] === 'application/json';
    }

    /**
     * Handles the then clause.
     * @param clause The clause.
     * @param matchingMockState The matching mock state.
     * @param state The state.
     */
    private handleThenCriteria(clause: MockResponseThenClause, matchingMockState: MockState, state: IState): void {
        if (clause.criteria === undefined
            || this.matchesTimesCalledCriteria(clause.criteria, matchingMockState)) {
            clause.mocks.forEach((m) => {
                const matchingMockToUpdate = m.name
                    ? state.mocks[m.name]
                    : matchingMockState;
                if (matchingMockToUpdate !== undefined) {
                    matchingMockToUpdate.counter = 0;
                    matchingMockToUpdate.scenario = m.scenario;
                } else {
                    console.error(`No scenario matching name [${m.name}] exists`);
                }
            });
        }
    }

    /**
     * Indicates if the mock matches the number of times called criteria.
     *
     * @param {MockResponseThenClauseCriteria} criteria The criteria.
     * @param {MockState} matchingMockState The matching mock state.
     * @return {boolean} indicator The indicator.
     */
    private matchesTimesCalledCriteria(criteria: MockResponseThenClauseCriteria, matchingMockState: MockState): boolean {
        return criteria.times === undefined || criteria.times === matchingMockState.counter;
    }

    /**
     * Sends the response back.
     * @param {Object} params The parameters.
     * @param {MockResponseThenClause} thenClause The Mock response then clause.
     * @param {http.ServerResponse} response The http response.
     * @param {number} status The http status.
     * @param {Object} headers The http headers.
     * @param {Buffer | string} chunk The chunk.
     */
    private respond(params: { id: string; mock: Mock }, thenClause: MockResponseThenClause, response: http.ServerResponse, status: number, headers: { [p: string]: string }, chunk: Buffer | string) {
        const state = this.state.getMatchingState(params.id);
        const matchingMock = state.mocks[params.mock.name];
        matchingMock.counter += 1;

        if (thenClause !== undefined) {
            this.handleThenCriteria(thenClause, matchingMock, state);
        }

        response.writeHead(status, headers);
        response.end(chunk);
    }
}
