import Recording from './recording';

/** State. */
interface State {
    mocks: {
        [identifier: string]: {
            scenario: string;
            delay: number;
            echo: boolean;
        }
    };
    variables: { [key: string]: string };
    recordings: { [identifier: string]: Recording[] };
    record: boolean;
}

export default State;
