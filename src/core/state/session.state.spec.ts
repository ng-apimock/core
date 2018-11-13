import SessionState from './session.state';

describe('SessionState', () => {
    let state: SessionState;

    describe('constructor', () => {
        beforeAll(() => {
            state = new SessionState('id');
        });

        it('sets the identifier', () =>
            expect(state.identifier).toBe('id'));

        it('creates a new mocks object', () =>
            expect(state.mocks).toEqual({}));

        it('creates a new variables object', () =>
            expect(state.variables).toEqual({}));
    });
});
