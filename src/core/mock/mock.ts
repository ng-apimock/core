import {MockRequest} from './mock.request';
import {MockResponse} from './mock.response';

/** Mock. */
export interface Mock {
    // the name of the mock
    name: string;
    // type of response object either
    isArray?: boolean;
    // the request
    request: MockRequest;
    // the available responses
    responses: { [key: string]: MockResponse };
    // the path to the mock file
    path?: string;
    // delay
    delay?: number;
}
