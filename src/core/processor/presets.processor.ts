import 'reflect-metadata';
import {inject, injectable} from 'inversify';
import {State} from '../state/state';
import {ProcessingOptions} from './processing.options';
import * as glob from 'glob';
import * as path from "path";
import * as fs from 'fs-extra';
import {Preset} from '../preset/preset';

/** Presets processor. */
@injectable()
export class PresetsProcessor {
    private DEFAULT_PATTERN = '**/*.preset.json';

    /**
     * Constructor.
     * @param {State} state The state.
     */
    constructor(@inject('State') public state: State) {
    }

    /**
     * Initialize apimock by:
     * - processing the globs and processing all available presets.
     * @param {ProcessingOptions} options The processing options.
     */
    process(options: ProcessingOptions): void {
        let counter = 0;
        const pattern = (options.patterns && options.patterns.presets) ? options.patterns.presets : this.DEFAULT_PATTERN;

        glob.sync(pattern, {
            cwd: options.src,
            root: '/'
        }).forEach((file) => {
            const presetPath = path.join(options.src, file);
            const preset = fs.readJsonSync(presetPath);
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
