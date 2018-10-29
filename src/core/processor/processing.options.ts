interface ProcessingOptions {
    src: string;
    patterns?: {
        mocks?: string;
        presets?: string;
    };
}

export default ProcessingOptions;
