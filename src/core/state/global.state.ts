import State from './state';
import Recording from './recording';

/** Global state. */
class GlobalState implements State {
    mocks: {
        [identifier: string]: {
            scenario: string;
            delay: number;
            echo: boolean;
        }
    };
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
