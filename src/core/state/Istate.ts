import { MockState } from './mock.state';
import { Recording } from './recording';

/** State. */
export interface IState {
    mocks: { [identifier: string]: MockState };
    variables: { [key: string]: any };
    recordings: { [identifier: string]: Recording[] };
    record: boolean;
}
