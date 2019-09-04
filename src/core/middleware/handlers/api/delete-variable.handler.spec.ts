import * as http from 'http';
import {assert, createStubInstance, SinonStub, SinonStubbedInstance, stub} from 'sinon';
import {Container} from 'inversify';
import {DeleteVariableHandler} from './delete-variable.handler';
import {HttpHeaders, HttpMethods, HttpStatusCode} from '../../http';
import {IState} from '../../../state/Istate';
import {State} from '../../../state/state';

describe('DeleteVariableHandler', () => {
    let container: Container;
    let handler: DeleteVariableHandler;
    let matchingState: IState;
    let state: SinonStubbedInstance<State>;

    beforeEach(() => {
        container = new Container();
        state = createStubInstance(State);

        container.bind('BaseUrl').toConstantValue('/base-url');
        container.bind('DeleteVariableHandler').to(DeleteVariableHandler);
        container.bind('State').toConstantValue(state);

        handler = container.get<DeleteVariableHandler>('DeleteVariableHandler');
    });

    describe('handle', () => {
        let nextFn: SinonStub;
        let request: SinonStubbedInstance<http.IncomingMessage>;
        let response: SinonStubbedInstance<http.ServerResponse>;

        beforeEach(() => {
            nextFn = stub();
            request = createStubInstance(http.IncomingMessage);
            response = createStubInstance(http.ServerResponse);

            request.url = `${'/base-url'}/variables/one`;
            matchingState = {
                mocks: {},
                variables: JSON.parse(JSON.stringify({one: 'first', two: 'second', three: 'third'})),
                recordings: {},
                record: false
            };
            state.getMatchingState.returns(matchingState);
        });

        it('deletes the variable', () => {
            expect(Object.keys(matchingState.variables).length).toBe(3);

            handler.handle(request as any, response as any, nextFn, {id: 'apimockId'});

            expect(Object.keys(matchingState.variables).length).toBe(2);
            assert.calledWith(response.writeHead, HttpStatusCode.OK, HttpHeaders.CONTENT_TYPE_APPLICATION_JSON);
            assert.called(response.end);
        });
    });

    describe('isApplicable', () => {
        let request: SinonStubbedInstance<http.IncomingMessage>;

        beforeEach(() => {
            request = createStubInstance(http.IncomingMessage);
        });

        it('indicates applicable when url and method match', () => {
            request.url = `${'/base-url'}/variables`;
            request.method = HttpMethods.DELETE;
            expect(handler.isApplicable(request as any)).toBe(true);
        });
        it('indicates not applicable when the method does not match', () => {
            request.url = `${'/base-url'}/variables`;
            request.method = HttpMethods.GET;
            expect(handler.isApplicable(request as any)).toBe(false);
        });
        it('indicates not applicable when the url does not match', () => {
            request.url = `${'/base-url'}/no-match`;
            request.method = HttpMethods.DELETE;
            expect(handler.isApplicable(request as any)).toBe(false);
        });
    });
});
