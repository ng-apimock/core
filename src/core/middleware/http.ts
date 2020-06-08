export namespace HttpMethods {
    export const GET = 'GET';
    export const POST = 'POST';
    export const PUT = 'PUT';
    export const DELETE = 'DELETE';
    export const HEAD = 'HEAD';
}

export namespace HttpHeaders {
    export const CONTENT_TYPE_APPLICATION_JSON = { 'Content-Type': 'application/json' };
    export const CONTENT_TYPE_BINARY = { 'Content-Type': 'application/octet-stream' };
}

export namespace HttpStatusCode {
    export const OK = 200;
    export const CONFLICT = 409;
    export const INTERNAL_SERVER_ERROR = 500;
}
