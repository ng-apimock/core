import * as http from 'http';

import { Container } from 'inversify';
import { createSpyObj } from 'jest-createspyobj';

import { IState } from '../../../state/Istate';
import { State } from '../../../state/state';
import { HttpHeaders, HttpStatusCode } from '../../http';

import { RecordHandler } from './record.handler';

describe('RecordHandler', () => {
    let container: Container;
    let handler: RecordHandler;
    let matchingState: IState;
    let state: jest.Mocked<State>;

    beforeEach(() => {
        container = new Container();
        state = createSpyObj(State);

        container.bind('BaseUrl').toConstantValue('/base-url');
        container.bind('RecordHandler').to(RecordHandler);
        container.bind('State').toConstantValue(state);

        handler = container.get<RecordHandler>('RecordHandler');
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

            matchingState = {
                mocks: JSON.parse(JSON.stringify({
                    one: { scenario: 'some', delay: 0, echo: true },
                    two: { scenario: 'thing', delay: 1000, echo: false }
                })),
                variables: {},
                recordings: {},
                record: false
            };
            state.getMatchingState.mockReturnValue(matchingState);
        });

        it('sets the recording indicator', () => {
            handler.handle(request as any, response as any, nextFn, {
                id: 'apimockId',
                body: { record: true }
            });

            expect(matchingState.record).toBe(true);
            expect(response.writeHead).toHaveBeenCalledWith(HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            expect(response.end).toHaveBeenCalled();
        });
    });

    describe('isApplicable', () => {
        let request: http.IncomingMessage;

        beforeEach(() => {
            request = {} as http.IncomingMessage;
        });

        it('indicates applicable when url and action match', () => {
            request.url = `${'/base-url'}/actions`;
            expect(handler.isApplicable(request as any, { action: 'record' })).toBe(true);
        });
        it('indicates not applicable when the action does not match', () => {
            request.url = `${'/base-url'}/actions`;
            expect(handler.isApplicable(request as any, { action: 'NO-MATCHING-ACTION' })).toBe(false);
        });
        it('indicates not applicable when the url does not match', () => {
            request.url = `${'/base-url'}/no-match`;
            expect(handler.isApplicable(request as any, { action: 'record' })).toBe(false);
        });
    });
});
