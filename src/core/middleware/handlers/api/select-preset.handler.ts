import * as http from 'http';

import * as debug from 'debug';
import { inject, injectable } from 'inversify';

import { Configuration } from '../../../configuration';
import { Mock } from '../../../mock/mock';
import { Preset } from '../../../preset/preset';
import { IState } from '../../../state/Istate';
import { MockState } from '../../../state/mock.state';
import { State } from '../../../state/state';
import { HttpHeaders, HttpMethods, HttpStatusCode } from '../../http';
import { ApplicableHandler } from '../handler';

export const log = debug('ng-apimock:handler-select-preset');

/**  Select preset handler. */
@injectable()
export class SelectPresetHandler implements ApplicableHandler {
    private DEFAULT_DELAY = 0;
    private DEFAULT_ECHO = false;

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
        id: string, body: { name: string }
    }): void {
        const state = this.state.getMatchingState(params.id);
        const { body } = params;
        try {
            const presetName: string = body.name;
            const matchingPreset: Preset = this.state.presets.find((preset) => preset.name === presetName);

            if (matchingPreset !== undefined) {
                try {
                    this.updateMocks(state, matchingPreset);
                    this.updateVariables(state, matchingPreset);
                    log(`Selected preset [${presetName}]`);
                } catch (e) {
                    log(e.message);
                    response.writeHead(HttpStatusCode.INTERNAL_SERVER_ERROR, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
                    response.end(JSON.stringify(e, ['message']));
                }
            } else {
                throw new Error(`No preset matching name ['${presetName}'] found`);
            }
            response.writeHead(HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            response.end(`Selected preset [${presetName}]`);
        } catch (e) {
            log(e.message);
            response.writeHead(HttpStatusCode.CONFLICT, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            response.end(JSON.stringify(e, ['message']));
        }
    }

    /** {@inheritDoc}. */
    isApplicable(request: http.IncomingMessage): boolean {
        const methodMatches = request.method === HttpMethods.PUT;
        const urlMatches = request.url.startsWith(`${this.configuration.middleware.basePath}/presets`)
            && request.url.endsWith('/presets');
        return urlMatches && methodMatches;
    }

    /**
     * Update the mocks state with the preset.
     * @param {IState} state The state.
     * @param {Preset} preset The preset
     */
    updateMocks(state: IState, preset: Preset): void {
        if (preset.mocks !== undefined) {
            Object.keys(preset.mocks).forEach((mock) => {
                const mockState: MockState = preset.mocks[mock];
                const matchingMock: Mock = this.state.mocks.find((_mock) => _mock.name === mock);
                const scenarioExists = Object.keys(matchingMock.responses)
                    .find((scenario) => scenario === mockState.scenario) !== undefined;

                if (scenarioExists || mockState.scenario === 'passThrough') {
                    state.mocks[mock] = JSON.parse(JSON.stringify(preset.mocks[mock]));
                    if (state.mocks[mock].echo === undefined) {
                        state.mocks[mock].echo = this.DEFAULT_ECHO;
                    }
                    if (state.mocks[mock].delay === undefined) {
                        state.mocks[mock].delay = this.DEFAULT_DELAY;
                    }
                } else {
                    throw new Error(`No scenario matching ['${mockState.scenario}'] found for mock with name ['${mock}']`);
                }
            });
        }
    }

    /**
     * Update the variables state with the preset.
     * @param {IState} state The state.
     * @param {Preset} preset The preset
     */
    updateVariables(state: IState, preset: Preset): void {
        if (preset.variables !== undefined) {
            Object.keys(preset.variables).forEach((variable) => {
                state.variables[variable] = preset.variables[variable];
            });
        }
    }
}
