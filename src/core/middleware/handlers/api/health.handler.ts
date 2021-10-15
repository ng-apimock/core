import * as http from 'http';

import { debug } from 'debug';
import { inject, injectable } from 'inversify';

import { Configuration } from '../../../configuration';
import { HttpHeaders, HttpMethods, HttpStatusCode } from '../../http';
import { ApplicableHandler } from '../handler';

export const log = debug('ng-apimock:handler-health');

/**  Health handler. */
@injectable()
export class HealthHandler implements ApplicableHandler {
    /**
     * Constructor.
     * @param {Configuration} configuration The configuration.
     */
    constructor(@inject('Configuration') private configuration: Configuration) {
    }

    /** {@inheritDoc}. */
    handle(request: http.IncomingMessage, response: http.ServerResponse, next: Function, params: { id: string }): void {
        log('Health');

        const result: any = request.url.endsWith('health/liveness') || request.url.endsWith('health/readiness')
            ? { status: 'UP', components: { refreshScope: { status: 'UP' } } }
            : {
                status: 'UP',
                components: {
                    livenessState: {
                        status: 'UP'
                    },
                    ping: {
                        status: 'UP'
                    },
                    readinessState: {
                        status: 'UP'
                    },
                    refreshScope: {
                        status: 'UP'
                    }
                },
                groups: [
                    'liveness',
                    'readiness'
                ]
            };

        response.writeHead(HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
        response.end(JSON.stringify(result));
    }

    /** {@inheritDoc}. */
    isApplicable(request: http.IncomingMessage): boolean {
        const methodMatches = request.method === HttpMethods.GET;
        const urlMatches = request.url.startsWith(`${this.configuration.middleware.basePath}/health`);
        return urlMatches && methodMatches;
    }
}
