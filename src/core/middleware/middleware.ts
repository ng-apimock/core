import * as http from 'http';

import { NextHandleFunction } from 'connect';
import { inject, injectable } from 'inversify';

import { Configuration } from '../configuration';
import { Mock } from '../mock/mock';
import { State } from '../state/state';

import { DefaultsHandler } from './handlers/api/defaults.handler';
import { DeleteVariableHandler } from './handlers/api/delete-variable.handler';
import { GetMocksHandler } from './handlers/api/get-mocks.handler';
import { GetPresetsHandler } from './handlers/api/get-presets.handler';
import { GetRecordedResponseHandler } from './handlers/api/get-recorded-response.handler';
import { GetRecordingsHandler } from './handlers/api/get-recordings.handler';
import { GetVariablesHandler } from './handlers/api/get-variables.handler';
import { InitHandler } from './handlers/api/init.handler';
import { PassThroughsHandler } from './handlers/api/pass-throughs.handler';
import { RecordHandler } from './handlers/api/record.handler';
import { SelectPresetHandler } from './handlers/api/select-preset.handler';
import { SetVariableHandler } from './handlers/api/set-variable.handler';
import { UpdateMocksHandler } from './handlers/api/update-mocks.handler';
import { ApplicableHandler } from './handlers/handler';
import { EchoRequestHandler } from './handlers/mock/echo.request.handler';
import { MockRequestHandler } from './handlers/mock/mock.request.handler';
import { RecordResponseHandler } from './handlers/mock/record.response.handler';

/** Middleware. */
@injectable()
export class Middleware {
    private handlers: ApplicableHandler[];

    /**
     * Constructor
     * @param {Configuration} configuration The configuration object.
     * @param {DefaultsHandler} defaultsHandler The defaults handler.
     * @param {DeleteVariableHandler} deleteVariableHandler The delete variables handler.
     * @param {EchoRequestHandler} echoRequestHandler The echo request handler.
     * @param {GetMocksHandler} getMocksHandler The get mocks handler.
     * @param {GetPresetsHandler} getPresetsHandler The get presets handler.
     * @param {GetRecordingsHandler} getRecordingsHandler The get recordings handler.
     * @param {GetRecordedResponseHandler} getRecordedResponseHandler The get recorded response handler.
     * @param {GetVariablesHandler} getVariablesHandler The get variables handler.
     * @param {InitHandler} initHandler The init handler.
     * @param {NextHandleFunction} bodyParser The body parser that is responsible for making the body available.
     * @param {MockRequestHandler} mockRequestHandler The mock request handler.
     * @param {PassThroughsHandler} passThroughsHandler The pass throughs handler.
     * @param {RecordHandler} recordHandler The record handler.
     * @param {RecordResponseHandler} recordResponseHandler The record response handler.
     * @param {SelectPresetHandler} selectPresetHandler The set preset handler.
     * @param {SetVariableHandler} setVariableHandler The set variables handler.
     * @param {State} apimockState The apimock state.
     * @param {UpdateMocksHandler} updateMocksHandler The update mocks handler.
     */
    constructor(@inject('Configuration') private configuration: Configuration,
                @inject('DefaultsHandler') private defaultsHandler: DefaultsHandler,
                @inject('DeleteVariableHandler') private deleteVariableHandler: DeleteVariableHandler,
                @inject('EchoRequestHandler') private echoRequestHandler: EchoRequestHandler,
                @inject('GetMocksHandler') private getMocksHandler: GetMocksHandler,
                @inject('GetPresetsHandler') private getPresetsHandler: GetPresetsHandler,
                @inject('GetRecordingsHandler') private getRecordingsHandler: GetRecordingsHandler,
                @inject('GetRecordedResponseHandler') private getRecordedResponseHandler: GetRecordedResponseHandler,
                @inject('GetVariablesHandler') private getVariablesHandler: GetVariablesHandler,
                @inject('InitHandler') private initHandler: InitHandler,
                @inject('JsonBodyParser') private bodyParser: NextHandleFunction,
                @inject('MockRequestHandler') private mockRequestHandler: MockRequestHandler,
                @inject('PassThroughsHandler') private passThroughsHandler: PassThroughsHandler,
                @inject('RecordHandler') private recordHandler: RecordHandler,
                @inject('RecordResponseHandler') private recordResponseHandler: RecordResponseHandler,
                @inject('SelectPresetHandler') private selectPresetHandler: SelectPresetHandler,
                @inject('SetVariableHandler') private setVariableHandler: SetVariableHandler,
                @inject('State') private apimockState: State,
                @inject('UpdateMocksHandler') private updateMocksHandler: UpdateMocksHandler) {
        this.handlers = [
            defaultsHandler,
            deleteVariableHandler,
            getMocksHandler,
            getPresetsHandler,
            getRecordingsHandler,
            getVariablesHandler,
            initHandler,
            passThroughsHandler,
            getRecordedResponseHandler,
            recordHandler,
            setVariableHandler,
            selectPresetHandler,
            updateMocksHandler
        ];
    }

    /**
     * Apimock Middleware.
     * @param {http.IncomingMessage} request The request.
     * @param {http.ServerResponse} response The response.
     * @param {Function} next The next callback function.
     */
    middleware(request: http.IncomingMessage, response: http.ServerResponse, next: Function): void {
        const apimockId: string = this.getApimockId(request.headers);
        this.bodyParser(request, response, () => {
            const { body } = request as any;
            const handler = this.getMatchingApplicableHandler(request, body);
            if (handler !== undefined) {
                handler.handle(request, response, next, { id: apimockId, body });
            } else {
                const matchingMock: Mock = this.apimockState.getMatchingMock(request.url, request.method, request.headers, body);
                if (matchingMock !== undefined) {
                    this.echoRequestHandler.handle(request, response, next, {
                        id: apimockId,
                        mock: matchingMock,
                        body
                    });
                    const matchingState = this.apimockState.getMatchingState(apimockId);
                    if (matchingState.record && request.headers.record === undefined) {
                        this.recordResponseHandler.handle(request, response, next, {
                            id: apimockId,
                            mock: matchingMock,
                            body
                        });
                    } else {
                        this.mockRequestHandler.handle(request, response, next, {
                            id: apimockId,
                            mock: matchingMock
                        });
                    }
                } else {
                    next();
                }
            }
        });
    }

    /**
     * Get the applicable handler.
     * @param {http.IncomingMessage} request The request.
     * @param body The body.
     * @return {ApplicableHandler} handler The applicable handler.
     */
    getMatchingApplicableHandler(request: http.IncomingMessage, body: any): ApplicableHandler {
        return this.handlers.find((handler: ApplicableHandler) => handler.isApplicable(request, body));
    }

    /**
     * Get the apimockId from the given cookies.
     * @param headers The headers.
     * @returns {string} id The apimock id.
     */
    getApimockId(headers: http.IncomingHttpHeaders): string {
        return this.configuration.middleware.useHeader
            ? this.getApimockIdFromHeader(headers)
            : this.getApimockIdFromCookie(headers);
    }

    /**
     * Gets the apimock identifier from the header.
     * @param { http.IncomingHttpHeaders} headers The headers.
     * @return {string} identifier The identifier.
     */
    getApimockIdFromHeader(headers: http.IncomingHttpHeaders): string {
        return headers[this.configuration.middleware.identifier] as string;
    }

    /**
     * Gets the apimock identifier from the cookie.
     * @param { http.IncomingHttpHeaders} headers The headers.
     * @return {string} identifier The identifier.
     */
    getApimockIdFromCookie(headers: http.IncomingHttpHeaders): string {
        return headers.cookie && (headers.cookie as string)
            .split(';')
            .map((cookie) => {
                const parts = cookie.split('=');
                return {
                    key: parts.shift().trim(),
                    value: decodeURI(parts.join('='))
                };
            })
            .filter((cookie: { key: string, value: string }) => cookie.key === this.configuration.middleware.identifier)
            .map((cookie: { key: string, value: string }) => cookie.value)[0];
    }
}
