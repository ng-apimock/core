import MockResponse from './mock.response';
import MockRequest from './mock.request';

/** Mock. */
interface Mock {
    // the name of the mock
    name: string;
    // type of response object either
    isArray?: boolean;
    // the request
    request: MockRequest;
    // the available responses
    responses: { [key: string]: MockResponse };
}

export default Mock;
