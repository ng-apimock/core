import * as http from 'http';
import * as path from 'path';

import * as debug from 'debug';
import * as fs from 'fs-extra';
import { inject, injectable } from 'inversify';

import { Configuration } from '../../../configuration';
import { Preset } from '../../../preset/preset';
import { State } from '../../../state/state';
import { HttpHeaders, HttpMethods, HttpStatusCode } from '../../http';
import { HandlerUtils } from '../handerutil';
import { ApplicableHandler } from '../handler';

export const log = debug('ng-apimock:handler-create-preset');

/**  Handler for creating an empty preset with the configured preset extention.
 * adding mocks / scenario's can be done with a PUT request to the created preset.
*/
@injectable()
export class CreatePresetHandler implements ApplicableHandler {
    /**
     * Constructor.
     * @param {Configuration} configuration The configuration.
     * @param {State} state The state.
     */
    constructor(@inject('Configuration') private configuration: Configuration,
                @inject('State') private state: State) {}

    /** {@inheritDoc}. */
    handle(request: http.IncomingMessage, response: http.ServerResponse, next: Function, params: {
        id: string, body: Preset
    }): void {
        const { body } = params;
        try {
            if (body.name && body.mocks && body.variables) {
                if (HandlerUtils.checkIfPresetExists(this.state, body.name)) {
                    throw new Error(`Preset with name: [${body.name}] already exists`);
                }
                this.savePreset(body);
            } else {
                throw new Error('A new preset should have a name, and a series of existing mocks with scenarios');
            }
            const message = `Created preset [${body.name}]`;
            log(message);
            response.writeHead(HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            response.end(message);
        } catch (e) {
            log(e.message);
            response.writeHead(HttpStatusCode.CONFLICT, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            response.end(JSON.stringify(e, ['message']));
        }
    }

    savePreset(preset: Preset) {
        const processConfig = this.state.getProcessingOptions();
        // remove wildcard tokens from config
        const presetExt = processConfig.patterns.presets;
        const presetExtention = presetExt.substring(presetExt.lastIndexOf('*') + 1).replace(/^\./, '');

        //  save a preset with just the name and empty mocs / variables
        fs.outputJSONSync(path.join(processConfig.src, `${preset.name.replace(' ', '')}.${presetExtention}`), preset, { spaces: 2 });
    }

    /** {@inheritDoc}. */
    isApplicable(request: http.IncomingMessage): boolean {
        const methodMatches = request.method === HttpMethods.POST;
        const urlMatches = request.url.startsWith(`${this.configuration.middleware.basePath}/presets`);
        return urlMatches && methodMatches;
    }
}
