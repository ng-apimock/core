export interface MiddlewareConfiguration {
    basePath: string;
    identifier: string;
    useHeader: boolean;
}

export interface Configuration {
    middleware: MiddlewareConfiguration;
}

export const DefaultConfiguration: Configuration = {
    middleware: {
        basePath: '/ngapimock',
        identifier: 'apimockid',
        useHeader: false
    }
};
