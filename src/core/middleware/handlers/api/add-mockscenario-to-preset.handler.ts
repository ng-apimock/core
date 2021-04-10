import * as http from 'http';
import * as path from 'path';

import * as debug from 'debug';
import * as fs from 'fs-extra';
import { inject, injectable } from 'inversify';

import { Configuration } from '../../../configuration';
import { Preset } from '../../../preset/preset';
import { MockState } from '../../../state/mock.state';
import { State } from '../../../state/state';
import { HttpHeaders, HttpMethods, HttpStatusCode } from '../../http';
import { HandlerUtils } from '../handerutil';
import { ApplicableHandler } from '../handler';

export const log = debug('ng-apimock:handler-add-mock-scenario-to-preset');

/**  Handler for creating an empty preset with the configured preset extention.
 * adding mocks / scenario's can be done with a PUT request to the created preset.
*/
@injectable()
export class AddMockScenarioToPresetHandler implements ApplicableHandler {
    /**
     * Constructor.
     * @param {Configuration} configuration The configuration.
     * @param {State} state The state.
     */
    constructor(@inject('Configuration') private configuration: Configuration,
                @inject('State') private state: State) {}

    /** {@inheritDoc}. */
    handle(request: http.IncomingMessage, response: http.ServerResponse, next: Function, params: {
        id: string, body: {
            mockName: string,
            mockState: MockState
        }
    }): void {
        const { body } = params;
        try {
            const { url } = request;
            const presetName = new RegExp(`${this.configuration.middleware.basePath}/presets/(.*)`).exec(url)[1];
            if (body.mockName && body.mockState) {
                if (!HandlerUtils.checkIfPresetExists(this.state, presetName)) {
                    throw new Error(`No preset found with name: [${presetName}]`);
                }
                if (!HandlerUtils.checkIfMockExists(this.state, body.mockName)) {
                    throw new Error(`No mock found with name: [${body.mockName}]`);
                }
                if (!HandlerUtils.checkIsScenarioExists(this.state, body.mockName, body.mockState.scenario)) {
                    throw new Error(`No scenario found with name: [${body.mockState.scenario}] in mock with name [${body.mockName}]`);
                }
                this.addMockScenarioToPreset(presetName, body.mockName, body.mockState);
            } else {
                throw new Error('A new preset should have existing mocks with scenarios');
            }
            const message = `Added mock [${body.mockName}] to preset`;
            log(message);
            response.writeHead(HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            response.end(message);
        } catch (e) {
            response.writeHead(HttpStatusCode.CONFLICT, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            log(e.message);
            response.end(JSON.stringify(e, ['message']));
        }
    }

    addMockScenarioToPreset(preset: string, mockName: string, mockState: MockState) {
        const processConfig = this.state.getProcessingOptions();
        // remove wildcard tokens from config
        const presetExt = processConfig.patterns.presets;
        const presetExtention = presetExt.substring(presetExt.lastIndexOf('*') + 1).replace(/^\./, '');
        const presetFilePath = path.join(processConfig.src, `${preset.replace(' ', '')}.${presetExtention}`);
        const presetFile = fs.readFileSync(presetFilePath, 'utf-8');
        const existingPreset: Preset = JSON.parse(presetFile);
        existingPreset.mocks[mockName] = mockState;
        fs.outputJSONSync(presetFilePath, existingPreset, { spaces: 2 });
    }

    /** {@inheritDoc}. */
    isApplicable(request: http.IncomingMessage): boolean {
        const methodMatches = request.method === HttpMethods.PUT;
        // we match on a final slash to distinguish it from the SelectPresetsHandler
        const urlMatches = request.url.startsWith(`${this.configuration.middleware.basePath}/presets/`);
        return urlMatches && methodMatches;
    }
}
