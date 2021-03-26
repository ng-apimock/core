import { State } from '../../state/state';

import { HandlerUtils } from './handerutil';

describe('HandlerUtils', () => {
    const state: State = {} as State;
    describe('checkifMockExists', () => {
        beforeEach(() => {
            (state as any).mocks = [{
                name: 'mock1'
            }, {
                name: 'mock2'
            }];
        });
        it('should be true if a mock with the given name exists in state', () => {
            expect(HandlerUtils.checkIfMockExists(state, 'mock1')).toBeTruthy();
        });
        it('should be false is the given mock is not registered', () => {
            expect(HandlerUtils.checkIfMockExists(state, 'newmock')).toBeFalsy();
        });
    });

    describe('checkIFPresetExists', () => {
        beforeEach(() => {
            (state as any).presets = [{
                name: 'preset1'
            }, {
                name: 'preset2'
            }];
        });
        it('should be true if a preset with the given name exists in state', () => {
            expect(HandlerUtils.checkIfPresetExists(state, 'preset1')).toBeTruthy();
        });
        it('should be false is the given mock is not registered', () => {
            expect(HandlerUtils.checkIfPresetExists(state, 'notexistingpreset')).toBeFalsy();
        });
    });

    describe('CheckIfScenarioExists', () => {
        beforeEach(() => {
            (state as any).mocks = [{
                name: 'mock1',
                responses: {
                    scenario1: {}
                }
            }];
        });
        it('should be true it the scenario exists in the given mock', () => {
            expect(HandlerUtils.checkIsScenarioExists(state, 'mock1', 'scenario1')).toBeTruthy();
        });
        it('should be false if the scenario does not exists in the given mock', () => {
            expect(HandlerUtils.checkIsScenarioExists(state, 'mock1', 'ERROR')).toBeFalsy();
        });
    });
});
