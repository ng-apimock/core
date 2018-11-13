import GlobalState from './global.state';

describe('GlobalState', () => {
    let state: GlobalState;

    describe('constructor', () => {
        beforeAll(() => {
            state = new GlobalState();
        });

        it('creates a new mocks object', () =>
            expect(state.mocks).toEqual({}));

        it('creates a new variables object', () =>
            expect(state.variables).toEqual({}));

        it('creates a new recordings object', () =>
            expect(state.recordings).toEqual({}));

        it('sets the record indicator to false', () =>
            expect(state.record).toBe(false));
    });
});
