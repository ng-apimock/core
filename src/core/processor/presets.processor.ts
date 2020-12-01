import * as path from 'path';

import * as glob from 'glob';
import { inject, injectable } from 'inversify';

import { Preset } from '../preset/preset';
import { State } from '../state/state';

import { FileLoader } from './file.loader';
import { ProcessingOptions } from './processing.options';

/** Presets processor. */
@injectable()
export class PresetsProcessor {
    /**
     * Constructor.
     * @param {State} state The state.
     * @param {FileLoader} fileLoader The file loader.
     */
    constructor(@inject('State') public state: State, @inject('FileLoader') public fileLoader: FileLoader) {
    }

    /**
     * Initialize apimock by:
     * - processing the globs and processing all available presets.
     * @param {ProcessingOptions} options The processing options.
     */
    process(options: ProcessingOptions): void {
        if (options.watches?.presets) {
            // trigger deletion of files matching preset watches pattern from cache
            glob.sync(options.watches.presets, {
                cwd: options.src,
                root: '/',
                nodir: true // prevents error if pattern matches a dir
            }).forEach((file) => {
                this.fileLoader.loadFile(path.join(options.src, file));
            });
        }

        let counter = 0;
        const pattern = options.patterns.presets;

        glob.sync(pattern, {
            cwd: options.src,
            root: '/'
        }).forEach((file) => {
            const presetPath = path.join(options.src, file);
            const preset = this.fileLoader.loadFile(presetPath);
            const match = this.state.presets.find((_preset: Preset) => _preset.name === preset.name);
            const index = this.state.presets.indexOf(match);

            if (index > -1) { // exists so update preset
                console.warn(`Preset with identifier '${preset.name}' already exists. Overwriting existing preset.`);
                this.state.presets[index] = preset;
            } else { // add preset
                this.state.presets.push(preset);
                counter++;
            }
        });

        console.log(`Processed ${counter} unique presets.`);
    }
}
