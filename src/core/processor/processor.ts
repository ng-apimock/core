import 'reflect-metadata';
import {inject, injectable} from 'inversify';
import ProcessingOptions from './processing.options';
import MocksProcessor from './mocks.processor';
import PresetsProcessor from './presets.processor';

/** Mocks processor. */
@injectable()
class Processor {

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
        this.mocksProcessor.process(options);
        this.presetsProcessor.process(options);
    }
}

export default Processor;
