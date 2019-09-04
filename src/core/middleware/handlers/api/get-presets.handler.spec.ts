import * as http from 'http';
import {assert, createStubInstance, SinonStub, SinonStubbedInstance, stub} from 'sinon';
import {Container} from 'inversify';
import {GetPresetsHandler} from './get-presets.handler';
import {HttpHeaders, HttpMethods, HttpStatusCode} from '../../http';
import {State} from '../../../state/state';

describe('GetPresetsHandler', () => {
    let container: Container;
    let handler: GetPresetsHandler;
    let state: SinonStubbedInstance<State>;

    beforeEach(() => {
        container = new Container();
        state = createStubInstance(State);

        container.bind('BaseUrl').toConstantValue('/base-url');
        container.bind('GetPresetsHandler').to(GetPresetsHandler);
        container.bind('State').toConstantValue(state);

        handler = container.get<GetPresetsHandler>('GetPresetsHandler');
    });

    describe('handle', () => {
        let nextFn: SinonStub;
        let request: SinonStubbedInstance<http.IncomingMessage>;
        let response: SinonStubbedInstance<http.ServerResponse>;

        beforeEach(() => {
            nextFn = stub();
            request = createStubInstance(http.IncomingMessage);
            response = createStubInstance(http.ServerResponse);

            (state as any)._presets = [];
            state.presets.push(...[{
                name: 'one',
                mocks: {some: {scenario: 'success', delay: 2000, echo: true}, another: {scenario: 'failure'}},
                variables: {today: 'some date'}
            }]);
        });

        it('gets the presets', () => {
            handler.handle(request as any, response as any, nextFn);

            assert.calledWith(response.writeHead, HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            // @ts-ignore
            assert.calledWith(response.end, JSON.stringify({
                presets: [{
                    name: 'one',
                    mocks: {some: {scenario: 'success', delay: 2000, echo: true}, another: {scenario: 'failure'}},
                    variables: {today: 'some date'}
                }]
            }));
        });
    });

    describe('isApplicable', () => {
        let request: SinonStubbedInstance<http.IncomingMessage>;

        beforeEach(() => {
            request = createStubInstance(http.IncomingMessage);
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
