import * as chokidar from 'chokidar';
import { inject, injectable } from 'inversify';

import { MocksProcessor } from './mocks.processor';
import { PresetsProcessor } from './presets.processor';
import { DefaultProcessingOptions, ProcessingOptions } from './processing.options';

/** Mocks processor. */
@injectable()
export class Processor {
    /**
     * Constructor.
     * @param {MocksProcessor} mocksProcessor The mocks processor.
     * @param {PresetsProcessor} presetsProcessor The presets processor.
     */
    constructor(@inject('MocksProcessor') public mocksProcessor: MocksProcessor,
                @inject('PresetsProcessor') public presetsProcessor: PresetsProcessor) {
    }

    /**
     * Initialize apimock by:
     * - processing all the available mocks.
     * - processing all the available presets.
     * @param {ProcessingOptions} options The processing options.
     */
    process(options: ProcessingOptions): void {
        const opts = this.getMergedOptions(options);

        this.mocksProcessor.process(opts);
        this.presetsProcessor.process(opts);

        if (opts.watch) {
            if (opts.patterns.mockWatches) {
                chokidar.watch(`${opts.src}/${opts.patterns.mockWatches}`, {
                    ignoreInitial: true,
                    usePolling: true,
                    interval: 2000
                }).on('all', () => this.mocksProcessor.process(opts));
            }

            chokidar.watch(`${opts.src}/${opts.patterns.mocks}`, {
                ignoreInitial: true,
                usePolling: true,
                interval: 2000
            }).on('all', () => this.mocksProcessor.process(opts));

            chokidar.watch(`${opts.src}/${opts.patterns.presets}`, {
                ignoreInitial: true,
                usePolling: true,
                interval: 2000
            }).on('all', () => this.presetsProcessor.process(opts));
        }
    }

    /**
     * Gets the merged options.
     * @param {ProcessingOptions} options The options.
     * @returns {ProcessingOptions} mergedOptions The merged options.
     */
    private getMergedOptions(options: ProcessingOptions): ProcessingOptions {
        return { ...DefaultProcessingOptions, ...options };
    }
}
