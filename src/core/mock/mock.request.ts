/** Mock response. */
export interface MockRequest {
    // the url
    url: string;
    // the http method (GET, POST, PUT, DELETE)
    method: string;
    // body
    body?: { [key: string]: any };
    // body
    headers?: { [key: string]: string };
}
