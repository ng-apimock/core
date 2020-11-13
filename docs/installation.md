Ng-apimock is essentially a set of npm [packages](https://github.com/ng-apimock) that can be installed over npm.

## Requirements

- [Node.js](https://nodejs.org/en/download/) version >= 10.15.1 or above (which can be checked by running `node -v`). You can use [nvm](https://github.com/nvm-sh/nvm) for managing multiple Node versions on a single machine installed
- [Yarn](https://yarnpkg.com/en/) version >= 1.5 (which can be checked by running `yarn version`). Yarn is a performant package manager for JavaScript and replaces the `npm` client. It is not strictly necessary but highly encouraged.
To add the standard WireMock JAR as a project dependency, put the following in the dependencies section of your build file:

## Installing using npm / yarn
```bash
npm install @ng-apimock/core --save-dev
```
or 

```bash
yarn add @ng-apimock/core --dev
```

## Usage
Once the plugin has been installed, you can require it with this line of JavaScript:

```js
const apimock = require('@ng-apimock/core');
```


### Processor
The next step is to tell [@ng-apimock/core](https://github.com/ng-apimock/core) where it can find the mocks and / or presets.
You can do that by calling the processor.

```js
apimock.processor.process({
    src: 'mocks', // required
    patterns: { // optional
        mocks: '**/*Mock.json', // optional: default is '**/*.mock.json'
        presets: '**/*Preset.json', // optional: default is '**/*.preset.json'
        mockWatches: '**/*.json' // optional: no default, set if watch files regex is different from mocks pattern
    },
    watch: true // optional: default is 'false'
});
```

There are 3 parameters here:
- **src**: this is the directory that will be use to search for mocks and presets.
- **patterns**: there are 3 regex patterns that can be overridden, mocks, presets and mockWatches. 
- **watch**: set to true will ensure that ng-apimock will watch for file changes.

:::caution

As a side-effect, when a mock or preset change has been detected, the saved state will be reset.

:::
   
### Middleware
The final step to take is to register [@ng-apimock/core](https://github.com/ng-apimock/core) as middleware. It is compatible with both [Connect](https://www.npmjs.com/package/connect) and [Express](https://www.npmjs.com/package/express)

```js
const connect = require('connect');
const app = connect();

app.use(apimock.middleware);
```

or 
```js
const express = require('express');
const app = express();

app.use(apimock.middleware);
```
#### Middleware body limit
The default bodyParser library that is used has a body limit is `100kb`. In order to increase the limit you can set the limit like this:

```js
app.use(bodyParser.json({limit: '10mb'}));
```

#### Middleware configuration
You can configure apimock with a configuration object.

```js
apimock.configure({
    middleware:{
        useHeader: true, // optional: indicator to use a header instead of a cookie to provide the identifier. (defaults to false)
        identifier: 'my-identifier' // optional: name of the header or cookie that is used as the identifier. (defaults to 'apimockid')
    }
});
```

:::important

The cookie or header is used to make sure that parallel executed tests **do not interfere** with each other. Each session is fully isolated.   

:::

### Minimal setup example 
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
