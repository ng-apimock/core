import { State } from '../../state/state';

export class HandlerUtils {
    static checkIfPresetExists(state: State, presetName: string): boolean {
        return !!state.presets.map((pre) => pre.name).find((elName) => elName === presetName);
    }

    static checkIfMockExists(state: State, mockName: string): boolean {
        return !!state.mocks.map((mock) => mock.name).find((elName) => elName === mockName);
    }

    static checkIsScenarioExists(state: State, mockname: string, scenarioname: string) {
        const targetMock = state.mocks.find((mock) => mock.name === mockname);
        return !!Object.keys(targetMock.responses).find((respName) => respName === scenarioname);
    }
}
