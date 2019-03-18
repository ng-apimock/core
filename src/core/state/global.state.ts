import {IState} from './Istate';
import {Recording} from './recording';
import {MockState} from './mock.state';

/** Global state. */
export class GlobalState implements IState {
    readonly _mocks: { [identifier: string]: MockState };
    readonly _variables: { [key: string]: string; };
    readonly _recordings: { [identifier: string]: Recording[] };
    record: boolean;

    /** Constructor. */
    constructor() {
        this._mocks = {};
        this._variables = {};
        this._recordings = {};
        this.record = false;
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
