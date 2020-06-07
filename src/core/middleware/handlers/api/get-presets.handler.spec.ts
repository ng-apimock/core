import * as http from 'http';
import { Container } from 'inversify';

import { createSpyObj } from 'jest-createspyobj';
import { State } from '../../../state/state';
import { HttpHeaders, HttpMethods, HttpStatusCode } from '../../http';

import { GetPresetsHandler } from './get-presets.handler';


describe('GetPresetsHandler', () => {
    let container: Container;
    let handler: GetPresetsHandler;
    let state: jest.Mocked<State>;

    beforeEach(() => {
        container = new Container();
        state = createSpyObj(State);

        container.bind('BaseUrl').toConstantValue('/base-url');
        container.bind('GetPresetsHandler').to(GetPresetsHandler);
        container.bind('State').toConstantValue(state);

        handler = container.get<GetPresetsHandler>('GetPresetsHandler');
    });

    describe('handle', () => {
        let nextFn: jest.Mock;
        let request: http.IncomingMessage;
        let response: http.ServerResponse;

        beforeEach(() => {
            nextFn = jest.fn();
            request = {} as http.IncomingMessage;
            response = {
                end: jest.fn(),
                writeHead: jest.fn()
            } as unknown as http.ServerResponse;

            (state as any).presets = [{
                name: 'one',
                mocks: {
                    some: { scenario: 'success', delay: 2000, echo: true },
                    another: { scenario: 'failure' }
                },
                variables: { today: 'some date' }
            }];
        });

        it('gets the presets', () => {
            handler.handle(request as any, response as any, nextFn);

            expect(response.writeHead).toBeCalledWith(HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            expect(response.end).toBeCalledWith(JSON.stringify({
                presets: [{
                    name: 'one',
                    mocks: {
                        some: { scenario: 'success', delay: 2000, echo: true },
                        another: { scenario: 'failure' }
                    },
                    variables: { today: 'some date' }
                }]
            }));
        });
    });

    describe('isApplicable', () => {
        let request: http.IncomingMessage;

        beforeEach(() => {
            request = {} as http.IncomingMessage;
        });

        it('indicates applicable when url and method match', () => {
            request.url = `${'/base-url'}/presets`;
            request.method = HttpMethods.GET;
            expect(handler.isApplicable(request as any)).toBe(true);
        });
        it('indicates not applicable when the method does not match', () => {
            request.url = `${'/base-url'}/presets`;
            request.method = HttpMethods.PUT;
            expect(handler.isApplicable(request as any)).toBe(false);
        });
        it('indicates not applicable when the url does not match', () => {
            request.url = `${'/base-url'}/no-match`;
            request.method = HttpMethods.GET;
            expect(handler.isApplicable(request as any)).toBe(false);
        });
    });
});
