import * as path from 'path';

export interface ProcessingOptions {
    src: string;
    patterns?: {
        mocks?: string;
        presets?: string;
    };
    watches?: {
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
};

export const GeneratedProcessingOptions = {
    src: path.join(process.cwd(), '.ngapimock', 'generated'),
    patterns: {
        presets: '**/*.preset.json',
        mocks: '**/*.mock.json'
    },
    watch: true
};
