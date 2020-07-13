export interface ProcessingOptions {
    src: string;
    patterns?: {
        mocks?: string;
        presets?: string;
    };
    watch?: boolean;
}

export const DefaultProcessingOptions = {
    patterns: {
        presets: '**/*.preset.*',
        mocks: '**/*.mock.*'
    }
};
