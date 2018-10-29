import IState from './Istate';
import Recording from './recording';
import MockState from './mock.state';

/** Global state. */
class GlobalState implements IState {
    mocks: { [identifier: string]: MockState };
    variables: { [key: string]: string; };
    recordings: { [identifier: string]: Recording[] };
    record: boolean;

    /** Constructor. */
    constructor() {
        this.mocks = {};
        this.variables = {};
        this.recordings = {};
        this.record = false;
    }
}

export default GlobalState;
