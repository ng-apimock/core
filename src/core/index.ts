import container from './ioc-container';
import Processor from './processor/processor';
import Middleware from './middleware/middleware';
import * as http from 'http';
import {Converter} from './convert';

/** NgApimock */
class NgApimock {
    get processor() {
        return container.get<Processor>('Processor');
    }

    middleware(request: http.IncomingMessage, response: http.ServerResponse, next: Function) {
        return container.get<Middleware>('Middleware').middleware(request, response, next);
    }

    get converter() {
        return new Converter();
    }
}

module.exports = new NgApimock();