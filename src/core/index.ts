import * as http from 'http';

import { Configuration, DefaultConfiguration } from './configuration';
import { Converter } from './convert';
import container from './ioc-container';
import { Middleware } from './middleware/middleware';
import { Processor } from './processor/processor';

/** NgApimock */
class NgApimock {
    /**
     * configure.
     * @param {Configuration} configuration The configuration.
     */
    configure(configuration: Configuration): void {
        const middlewareConfiguration = { ...DefaultConfiguration.middleware, ...configuration.middleware };
        container.rebind<Configuration>('Configuration').toConstantValue({ middleware: middlewareConfiguration });
    }

    /**
     * Gets the processor.
     * @return {Processor} processor The processor.
     */
    get processor(): Processor {
        return container.get<Processor>('Processor');
    }

    /**
     * Gets the middleware.
     * @param {http.IncomingMessage} request The request.
     * @param {http.ServerResponse} response The response.
     * @param {Function} next The next function.
     */
    middleware(request: http.IncomingMessage, response: http.ServerResponse, next: Function): void {
        const middleware = container.get<Middleware>('Middleware');
        return middleware.middleware(request, response, next);
    }

    /**
     * Converter.
     * @return {Converter} converter The converter.
     */
    get converter(): Converter {
        return new Converter();
    }
}

export = new NgApimock();
