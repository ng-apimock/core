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
        const d = Math.floor(seconds / (3600 * 24));
        const h = Math.floor((seconds % (3600 * 24)) / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);

        return (d > 0 ? `${d}${d === 1 ? ' day, ' : ' days, '}` : '')
            + (h > 0 ? `${h}${h === 1 ? ' hour, ' : ' hours, '}` : '')
            + (m > 0 ? `${m}${m === 1 ? ' minute, ' : ' minutes, '}` : '')
            + (s > 0 ? `${s}${s === 1 ? ' second' : ' seconds'}` : '');
    }
}
