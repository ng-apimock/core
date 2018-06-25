# ng-apimock/core 
> ng-apimock core module is a [Node.js](https://nodejs.org/) plugin that provides the ability to use scenario based api mocking. You can use it for both:
 - local development (see local development plugins)
 - automated testing (see automated testing plugins)
 
## Getting Started

```shell
npm install @ng-apimock/core --save-dev
```

Once the plugin has been installed, you can require it with this line of JavaScript:

```javascript
const ngApimock = require('@ng-apimock/core');
```
 
## How does it work
ng-apimock consists of 2 parts.

1. processor - responsible for processing the available mocks (see [Processor](#Processor))
2. middleware - responsible for handling api calls (see [Middleware](#Middleware))

## Processor
The processor is responsible for processing the available mocks.
In order to process the mocks you need to call the processor like this:

```javascript
ngApimock.processor.process({
    src: 'the/path/to/your/mocks',
    pattern: '**/*.mock.json' // optional, defaults to **/*.json
});
```

Every mock will be processed that matches the pattern within the source directory.
When a multiple mocks with the same name are available, they will override each other (a message will be printed to the console).

## Middleware
The middleware function handles requests. The function is compatible with both [Connect](https://github.com/senchalabs/connect) and [Express](https://expressjs.com/en/guide/using-middleware.html)

In order to use the middleware you can add the function to your serve configuration like this:

```javascript
const connect = require('connect');
const app = connect();

app.use(ngApimock.middleware);
```

Ng-apimock is makes sure that parallel executed tests do not interfere with each other. Each session is fully isolated.  

## How to write mocks
There are a couple of rules to follow.

1. For each api call create a separate file
2. Each file needs to follow the format below.

```json
{
  "name": "some mock", // the name of the mock
  "isArray": true, // optional, indicator that indicates if the response data is an array or object (for json response)
  "request": {
    "url": "/items", // the request url
    "method": "GET", // the request method
    "body": {}, // optional, body object
    "headers": {} // optional, headers object
  },
  "responses": {
    "something": {
        "status": 200, // optional, http status code (defaults to 200)
        "data": {}, // optional, response data (either an object or array of objects)
        "file": "some/file.pdf", // optional, file location
        "headers": {}, // optional headers object  
        "statusText": "some message", // optional, status text
        "default": true, // optional, indicates if this response will be returned by default
        "delay": 1000 // optional, delay in milliseconds
    }
  }
}
```

Response data can contain time sensitive information. For those cases, static mock data is not flexible enough. 
Ng-apimock can interpolate those types of data for you. If you want to interpolate specific parts of your response data, 
you need to surround the part with %% like this:

```json
{
    "responses" : {
        "some response": {
            "data": {
                "today": "%%today%%"
            }
        }
    }
}
```

These variables can be set using the available clients.

## Clients
There are a couple of clients available to connect to @ng-apimock.

- [@ng-apimock/protractor-plugin](https://github.com/ng-apimock/protractor-plugin)
- [@ng-apimock/web-interface]()

## Functions
Ng-apimock provides the following options:

- Selecting a scenario
- Delaying a response
- Echoing a request

- Adding / updating a variable
- Deleting a variable

See the client documentation for each of these functions.