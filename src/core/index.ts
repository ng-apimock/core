import container from './ioc-container';
import Processor from './processor/processor';
import Middleware from './middleware/middleware';
import * as http from 'http';

/** NgApimock */
class NgApimock {
    get processor() {
        return container.get<Processor>('Processor');
    }

    middleware(request: http.IncomingMessage, response: http.ServerResponse, next: Function) {
        return container.get<Middleware>('Middleware').middleware(request, response, next);
    }
}

module.exports = new NgApimock();