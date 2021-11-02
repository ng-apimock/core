import 'reflect-metadata';

import * as path from 'path';

import { inject, injectable } from 'inversify';

import { Configuration } from './configuration';
import { FileLoader } from './processor/file.loader';
import { State } from './state/state';

@injectable()
export class InstanceHolder {
    /**
     * Constructor
     * @param {Configuration} configuration The configuration.
     * @param {FileLoader} fileLoader The fileLoader.
     * @param {State} state The state
     */
    constructor(@inject('Configuration') private configuration: Configuration,
                @inject('FileLoader') private fileLoader: FileLoader,
                @inject('State') private state: State) {
    }

    /** Gets the information containing everything related to this running instance. */
    getInformation(): any {
        const packageJson = this.fileLoader.loadFile(path.join(__dirname, '..', 'package.json'));
        return {
            build: {
                artifact: packageJson.name,
                description: packageJson.description,
                version: packageJson.version,
            },
            configuration: this.configuration.middleware,
            processing: {
                options: this.state.getProcessingOptions()
            },
            processed: {
                mocks: this.state.mocks.length,
                presets: this.state.presets.length
            },
            uptime: this.uptime(process.uptime())
        };
    }

    /** Gets the uptime in readable format. */
    private uptime(seconds: number): string {
        return [
            { key: 'day', value: Math.floor(seconds / (3600 * 24)) },
            { key: 'hour', value: Math.floor((seconds % (3600 * 24)) / 3600) },
            { key: 'minute', value: Math.floor((seconds % 3600) / 60) },
            { key: 'second', value: Math.floor(seconds % 60) }
        ]
            .filter((entry) => entry.value !== 0)
            .map((entry) => `${entry.value} ${entry.key}${entry.value !== 1 ? 's' : ''}`)
            .join(', ');
    }
}
