import * as http from 'http';

import { debug } from 'debug';
import { inject, injectable } from 'inversify';

import { Configuration } from '../../../configuration';
import { InstanceHolder } from '../../../instance.holder';
import { HttpHeaders, HttpMethods, HttpStatusCode } from '../../http';
import { ApplicableHandler } from '../handler';

export const log = debug('ng-apimock:handler-information');

/**  Information handler. */
@injectable()
export class InformationHandler implements ApplicableHandler {
    /**
     * Constructor.
     * @param {Configuration} configuration The configuration.
     * @param {InstanceHolder} instanceHolder The instance holder
     */
    constructor(@inject('Configuration') private configuration: Configuration,
                @inject('InstanceHolder') private instanceHolder: InstanceHolder) {
    }

    /** {@inheritDoc}. */
    handle(request: http.IncomingMessage, response: http.ServerResponse, next: Function, params: { id: string }): void {
        log('Information');

        response.writeHead(HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
        response.end(JSON.stringify(this.instanceHolder.getInformation()));
    }

    /** {@inheritDoc}. */
    isApplicable(request: http.IncomingMessage): boolean {
        const methodMatches = request.method === HttpMethods.GET;
        const urlMatches = request.url.startsWith(`${this.configuration.middleware.basePath}/info`);
        return urlMatches && methodMatches;
    }
}
