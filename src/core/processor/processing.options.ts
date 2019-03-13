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
        presets: '**/*.preset.json',
        mocks: '**/*.mock.json'
    }
}