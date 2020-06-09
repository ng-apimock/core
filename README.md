# ng-apimock/core [![npm](https://img.shields.io/npm/v/@ng-apimock/core?color=brightgreen)](https://www.npmjs.com/package/@ng-apimock/core) [![Build Status](https://github.com/ng-apimock/core/workflows/CI/badge.svg)](https://github.com/ng-apimock/core/actions?workflow=CI) [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=ng-apimock_core&metric=alert_status)](https://sonarcloud.io/dashboard?id=ng-apimock_core) [![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/) [![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-brightgreen.svg)](https://github.com/semantic-release/semantic-release) [![Dependabot Status](https://api.dependabot.com/badges/status?host=github&repo=ng-apimock/core)](https://dependabot.com)[![dependency Status](https://img.shields.io/david/ng-apimock/core.svg)](https://david-dm.org/ng-apimock/core) [![devDependency Status](https://img.shields.io/david/dev/ng-apimock/core.svg)](https://david-dm.org/ng-apimock/core#info=devDependencies) ![npm downloads](https://img.shields.io/npm/dm/@ng-apimock/core)



> ng-apimock core module is a [Node.js](https://nodejs.org/) plugin that provides the ability to use scenario based api mocking. You can use it for both:
 - local development (see [local development plugins](#local-development-plugins))
 - automated testing (see [automated testing plugins](#automated-testing-plugins))
 
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

1. processor - responsible for processing the available mocks and presets (see [Processor](#Processor))
2. middleware - responsible for handling api calls (see [Middleware](#Middleware))

## Processor
The processor is responsible for processing the available mocks and presets.
In order to process the mocks and presets you need to call the processor like this:

```javascript
ngApimock.processor.process({
    src: 'the/path/to/your/mocks',
    patterns: {
        mocks: '**/*.mock.json', // optional, defaults to **/*.mock.json,
        presets: '**/*.preset.json' // optional, defaults to **/*.preset.json
    },
    watch: true // optional, defaults to false
});
```

Every mock and preset will be processed that matches the pattern within the source directory.
When duplicates (same name) mocks and preset are processed they will override the previously processed version (a message will be printed to the console).

## Middleware
The middleware function handles requests. The function is compatible with both [Connect](https://github.com/senchalabs/connect) and [Express](https://expressjs.com/en/guide/using-middleware.html)

In order to use the middleware you can add the function to your serve configuration like this:

```javascript
const connect = require('connect');
const app = connect();

app.use(ngApimock.middleware);
```

#### Middleware body limit
The default [bodyParser library](https://www.npmjs.com/package/body-parser#limit-3) that is used has a body limit is 100kb.
In order to increase the limit you can set the limit like this:
```javascript    
app.use(bodyParser.json({limit: '10mb'});
```

#### Middleware configuration
You can configure apimock with a configuration object.

```javascript
apimock.configure({
    middleware:{
        useHeader: true, // optional indicator to use a header to get the identifier. (defaults to false)
        identifier: 'my-identifier' // optional name for the header or cookie to contain the identifier. (defaults to 'apimockid')
    }
});
```

Ng-apimock makes sure that parallel executed tests do not interfere with each other. Each session is fully isolated.  

## How to write mocks
There are a couple of rules to follow.

1. For each api call create a separate file
2. Each file needs to follow the format below.

```
{
  "name": "some mock", // the name of the mock
  "isArray": true, // optional, indicator that indicates if the response data is an array or object (for json response)
  "request": {
    "url": "/items", // the regular express to match request urls
    "method": "GET", // the request method
    "body": {}, // optional, body object
    "headers": {} // optional, headers object
  },
  "responses": {
    "something": { // the name of the response
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

## How to write presets
There are a couple of rules to follow.

1. For each preset create a separate file
2. Each file needs to follow the format below.

```
{
  "name": "some flow", // the name of the preset
  "mocks": {
    "some mock": { // the name of the mock
      "scenario": "success", // the name of the scenario
      "echo": true, // optional, indicates if this request will echoed to the console (defaults to false)
      "delay": 3000 // optional, delay in milliseconds (defaults to 0)
    }
  },
  "variables": {
    "some-variable": "some value"
  }
}
```

## Clients
There are a couple of clients available to connect to @ng-apimock.

### Automated testing plugins
- [@ng-apimock/protractor-plugin](https://github.com/ng-apimock/protractor-plugin)
- [@ng-apimock/webdriver-plugin](https://github.com/ng-apimock/webdriverio-plugin)

### Local development plugins
- [@ng-apimock/dev-interface](https://github.com/ng-apimock/dev-interface)

## Functions
Ng-apimock provides the following options:

- Selecting a scenario
- Delaying a response
- Echoing a request

- Adding / updating a variable
- Deleting a variable

- Selecting a preset

- Recording request / responses

See the client documentation for each of these functions.
