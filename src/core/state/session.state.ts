import State from './state';
import Recording from './recording';

/** Session state. */
class SessionState implements State {
    identifier: string;
    mocks: {
        [identifier: string]: {
            scenario: string;
            delay: number;
            echo: boolean;
        }
    };
    variables: { [key: string]: string; }
    recordings: { [identifier: string]: Recording[] };
    record: boolean;

    /**
     * Constructor.
     * @param {string} identifier The session identifier.
     */
    constructor(identifier: string) {
        this.identifier = identifier;
        this.mocks = {};
        this.variables = {};
        this.recordings = {};
        this.record = false;
    }
}

export default SessionState;
