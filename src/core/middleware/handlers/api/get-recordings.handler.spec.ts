import * as http from 'http';
import {Container} from 'inversify';

import {IState} from '../../../state/Istate';
import {State} from '../../../state/state';
import {HttpHeaders, HttpMethods, HttpStatusCode} from '../../http';

import {GetRecordingsHandler} from './get-recordings.handler';

import {createSpyObj} from 'jest-createspyobj';

describe('GetRecordingsHandler', () => {
    let container: Container;
    let handler: GetRecordingsHandler;
    let matchingState: IState;
    let state: jest.Mocked<State>;

    beforeEach(() => {
        container = new Container();
        state = createSpyObj(State);

        container.bind('BaseUrl').toConstantValue('/base-url');
        container.bind('GetRecordingsHandler').to(GetRecordingsHandler);
        container.bind('State').toConstantValue(state);

        handler = container.get<GetRecordingsHandler>('GetRecordingsHandler');
    });

    describe('handle', () => {
        let nextFn: jest.Mock<Function>;
        let request: http.IncomingMessage;
        let response: http.ServerResponse;

        beforeEach(() => {
            nextFn = jest.fn();
            request = {} as http.IncomingMessage;
            response = {
                end: jest.fn(),
                writeHead: jest.fn()
            } as unknown as http.ServerResponse;

            (state as any).mocks = [
                {
                    name: 'one',
                    request: {url: '/one', method: 'GET'},
                    responses: {'some': {}, 'thing': {}}
                },
                {
                    name: 'two',
                    request: {url: '/two', method: 'POST'},
                    responses: {'some': {}, 'thing': {}}
                }
            ];
            matchingState = {
                mocks: JSON.parse(JSON.stringify({
                    one: {scenario: 'some', delay: 0, echo: true},
                    two: {scenario: 'thing', delay: 1000, echo: false}
                })),
                variables: {},
                recordings: {'some': []},
                record: true
            };
            state.getMatchingState.mockReturnValue(matchingState);
        });

        it('gets the recordings', () => {
            handler.handle(request as any, response as any, nextFn, {id: 'apimockId'});

            expect(response.writeHead).toHaveBeenCalledWith(HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            expect(response.end).toHaveBeenCalledWith(JSON.stringify({
                recordings: {'some': []},
                record: true
            }));
        });
    });

    describe('isApplicable', () => {
        let request: http.IncomingMessage;

        beforeEach(() => {
            request = {} as http.IncomingMessage;
        });

        it('indicates applicable when url and method match', () => {
            request.url = `${'/base-url'}/recordings`;
            request.method = HttpMethods.GET;
            expect(handler.isApplicable(request as any)).toBe(true);
        });
        it('indicates not applicable when the method does not match', () => {
            request.url = `${'/base-url'}/recordings`;
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
