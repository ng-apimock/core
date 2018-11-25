export interface Configuration {
    middleware: MiddlewareConfiguration;
}

export interface MiddlewareConfiguration {
    useHeader: boolean;
    identifier: string;
}

export const DefaultConfiguration: Configuration = {
    middleware: {
        useHeader: false,
        identifier: 'apimockid'
    }
};
