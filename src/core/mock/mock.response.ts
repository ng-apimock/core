import { MockResponseThenClause } from './mock.response.then.clause';

/** Mock response. */
export interface MockResponse {
    // response status code (default: 200)
    status?: number;
    // response data
    data?: {} | [{}];
    // response as file
    file?: string;
    // response headers
    headers?: { [key: string]: string };
    // response status text
    statusText?: string;
    // indicates this response is the default response
    default?: boolean;
    // chainable response
    then?: MockResponseThenClause;
    // override delay for the mock
    delay?: number;
}
