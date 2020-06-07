import { IState } from './Istate';
import { MockState } from './mock.state';
import { Recording } from './recording';

/** Session state. */
export class SessionState implements IState {
    readonly _identifier: string;
    readonly _mocks: { [identifier: string]: MockState };
    readonly _variables: { [key: string]: string; };
    readonly _recordings: { [identifier: string]: Recording[] };
    record: boolean;

    /**
     * Constructor.
     * @param {string} identifier The session identifier.
     * @param {Object} mocks The mocks.
     * @param {Object} variables The variables.
     */
    constructor(identifier: string, mocks: { [identifier: string]: MockState }, variables: { [key: string]: string; }) {
        this._identifier = identifier;
        this._mocks = mocks;
        this._variables = variables;
        this._recordings = {};
        this.record = false;
    }

    /** Gets the identifier. */
    get identifier(): string {
        return this._identifier;
    }

    /** Gets the mocks. */
    get mocks(): { [identifier: string]: MockState } {
        return this._mocks;
    }

    /** Gets the variables. */
    get variables(): { [key: string]: string; } {
        return this._variables;
    }

    /** Gets the recordings. */
    get recordings(): { [identifier: string]: Recording[] } {
        return this._recordings;
    }
}
