import Istate from './Istate';
import Recording from './recording';
import MockState from './mock.state';

/** Session state. */
class SessionState implements Istate {
    identifier: string;
    mocks: { [identifier: string]: MockState };
    variables: { [key: string]: string; };
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
