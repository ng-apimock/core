# @ng-apimock/core
[![npm](https://img.shields.io/npm/v/@ng-apimock/core?color=brightgreen)](https://www.npmjs.com/package/@ng-apimock/core)
[![Build Status](https://github.com/ng-apimock/core/workflows/CI/badge.svg)](https://github.com/ng-apimock/core/actions?workflow=CI) 
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=ng-apimock_core&metric=alert_status)](https://sonarcloud.io/dashboard?id=ng-apimock_core) 
[![Dependabot Status](https://img.shields.io/badge/dependabot-active-success.svg?logo=dependabot)](https://dependabot.com)
![License](https://img.shields.io/github/license/sourcerer-io/hall-of-fame.svg?color=blue) 
![ts](https://badgen.net/badge/-/typeScript/blue?icon=typescript&label)
[![jest](https://img.shields.io/badge/tested_with-jest-99424f.svg?color=blue)](https://github.com/facebook/jest)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?color=blue)](http://commitizen.github.io/cz-cli/)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-blue.svg)](https://github.com/semantic-release/semantic-release) 
![npm downloads](https://img.shields.io/npm/dm/@ng-apimock/core) 

## Introduction

> ng-apimock is a modular [Node.js](https://nodejs.org/) framework that provides the ability to use scenario based api mocking. 
 
You can use it for:
- [local development](https://ngapimock.org/docs/plugins/plugin-introduction/#local-development)
  - [dev-interface](https://ngapimock.org/docs/plugins/dev-interface)
- [automated testing](https://ngapimock.org/docs/plugins/plugin-introduction/#automated-testing)
  - [WebdriverIO](https://ngapimock.org/docs/plugins/wdio-ng-apimock-service)
  - [Protractor](https://ngapimock.org/docs/plugins/protractor-plugin)
  - [Cypress](https://ngapimock.org/docs/plugins/cypress-plugin)

 
## Installation
```bash
yarn add @ng-apimock/core --dev
```

### Minimal setup example (serve.js)
This is a minimal setup example of how you can manually use @ng-apimock/core
```js
const apimock = require('@ng-apimock/core');
const express = require('express');
const app = express();
app.set('port', 9999);

apimock.processor.process({
    src: 'mocks'
});

app.use(apimock.middleware);

app.listen(app.get('port'), () => {
    console.log('@ng-apimock/core running on port', app.get('port'));
});
```
To start up the script just type:
```bash
node serve.js
```

### Minimal setup example (serve.ts)
This is a minimal setup example in TypeScript of how you can manually use @ng-apimock/core
```ts
import * as apimock from '@ng-apimock/core';
import express, { Application } from 'express';
const app: Application = express();
app.set('port', 9999);

apimock.processor.process({
    src: 'mocks'
});

app.use(apimock.middleware);

app.listen(app.get('port'), () => {
    console.log('@ng-apimock/core running on port', app.get('port'));
});
```


### Endpoints
There are a few endpoints available when you startup `@ng-apimock/core`:
- `/ngapimock/info` - responsible for providing information of the running instance
- `/ngapimock/health` - responsible for providing status information
- `/ngapimock/health/readiness` - readiness probe
- `/ngapimock/health/liveness` - liveness probe

## Contact

We have a few channels for contact:

- [Slack](https://apimock.slack.com/)
- [GitHub Issues](https://github.com/ng-apimock/core/issues)

## Extensive documentation
- [Installation]( https://ngapimock.org/docs/installation) 
- [API]( https://ngapimock.org/docs/api/select-scenario) 
- [Plugins]( https://ngapimock.org/docs/plugins/plugin-introduction)
- [Changelog]( https://github.com/ng-apimock/core/blob/master/CHANGELOG.md)
- [OpenApi specification]( https://ngapimock.org/docs/openapi-specification)

## License

@ng-apimock is [MIT licensed](./LICENSE-MIT).
