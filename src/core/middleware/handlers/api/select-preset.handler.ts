import 'reflect-metadata';
import {inject, injectable} from 'inversify';

import * as http from 'http';
import State from '../../../state/state';
import {ApplicableHandler} from '../handler';
import {HttpHeaders, HttpMethods, HttpStatusCode} from '../../http';
import Preset from '../../../preset/preset';
import Mock from '../../../mock/mock';
import MockState from '../../../state/mock.state';

/**  Select preset handler. */
@injectable()
class SelectPresetHandler implements ApplicableHandler {
    private DEFAULT_DELAY = 0;
    private DEFAULT_ECHO = false;

    /**
     * Constructor.
     * @param {State} state The state.
     * @param {string} baseUrl The base url.
     */
    constructor(@inject('State') private state: State,
                @inject('BaseUrl') private baseUrl: string) {
    }

    /** {@inheritDoc}.*/
    handle(request: http.IncomingMessage, response: http.ServerResponse, next: Function, params: {
        id: string, body: { name: string }
    }): void {
        const state = this.state.getMatchingState(params.id);
        const body = params.body;
        try {
            const presetName: string = body.name;
            const matchingPreset: Preset = this.state.presets.find((preset) => preset.name === presetName);

            if (matchingPreset !== undefined) {
                try {
                    Object.keys(matchingPreset.mocks).forEach((mock) => {
                        const presetMock: MockState = matchingPreset.mocks[mock];
                        const matchingMock: Mock = this.state.mocks.find((_mock) => _mock.name === mock);

                        if (Object.keys(matchingMock.responses).find((scenario) => scenario === presetMock.scenario)) {
                            state.mocks[mock] = JSON.parse(JSON.stringify(matchingPreset.mocks[mock]));
                            if (state.mocks[mock].echo === undefined) {
                                state.mocks[mock].echo = this.DEFAULT_ECHO;
                            }
                            if (state.mocks[mock].delay === undefined) {
                                state.mocks[mock].delay = this.DEFAULT_DELAY;
                            }
                        } else {
                            throw new Error(`No scenario matching ['${presetMock.scenario}'] found`);
                        }
                    });
                    Object.keys(matchingPreset.variables).forEach((variable) => {
                        state.variables[variable] = matchingPreset.variables[variable];
                    });
                } catch (e) {
                    response.writeHead(HttpStatusCode.INTERNAL_SERVER_ERROR, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
                    response.end(JSON.stringify(e, ['message']));
                }
            } else {
                throw new Error(`No preset matching name ['${presetName}'] found`);
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
        const urlMatches = request.url.startsWith(`${this.baseUrl}/presets`);
        return urlMatches && methodMatches;
    }
}

export default SelectPresetHandler;
