# Migration guide
 
Migration from the [previous version of ng-apimock](https://github.com/mdasberg/ng-apimock) is pretty straight forward if you follow these steps.

- [convert your mocks to the new json format](#convert-your-mocks-to-the-new-json-format)
- [update your serve script for the middleware](#update-your-serve-script-for-the-middleware)
- [update your serve script for the dev-interface](#update-your-serve-script-for-the-dev-interface)
- [update your test framework plugin](#update-your-test-framework-plugin)
- [report any issues](#report-any-issues)

#### Convert your mocks to the new json format
The the new version of ng-apimock has some new features such as request body and header matching, you need to update your mocks.
A converter has been provided for you that takes care of this.
You can use the converter like this:

```javascript
const converter = require('@ng-apimock/core').converter;
converter.convert('src', // the directory where your old mock.json files are located
                  'dest', // the directory where the converted mock files are written to
                  '**/*.json'); // the optional glob pattern (defaults to: **/*.mock.json)

```

Each file that matches the pattern will be converted and writen to the destination directory.

#### Update your serve script for the middleware
The new version of ng-apimock has modular setup. This means that you can choose which plugin to use.
You can use the core like this:

```javascript
const apimock = require('@ng-apimock/core');
```

And the core's processor like this:

```javascript
apimock.processor.process({
    src: 'your/mocks/directory', // the directory where your mock.json files are located
    pattern: { // optional
        mocks: '**/*.json', // your optional mock.json glob pattern (defaults to: '**/*.mock.json')
        presets: '**/*.json', // your optional preset.json glob pattern (defaults to: '**/*.preset.json')
    }
});
``` 

And the core's middleware like this:
```javascript
const connect = require('connect');
const app = connect();

app.use(apimock.middleware);
``` 

#### Update your serve script for the dev-interface
Because of the modular setup of ng-apimock you can choose to use the dev-interface for local development.
You can serve the dev-interface like this:

```javascript
const devInterface = require('@ng-apimock/dev-interface');
const connect = require('connect');
const app = connect();

app.use('/dev-interface/', serveStatic(devInterface));
``` 

#### Update your test framework plugin
You can use the protractor-plugin like this:

```javascript
exports.config = {
    plugins: [{
        package: '@ng-apimock/protractor-plugin',
        options: {
            globalName: 'ngApimock'
        }
    }]
};
```

And from your tests like this:
```typescript
import {Client} from '@ng-apimock/protractor-plugin';
declare const ngApimock: Client; // match the global name

it('...', () => {
   ngApimock.selectScenario(...); 
});
``` 

You can use the webdriver-plugin like this:

```javascript
exports.config = {
    plugins: {
        '@ng-apimock/webdriverio-plugin': {
            globalName: 'client'
        }
    }
};

```

And from your tests like this:
```typescript
import {Client} from '@ng-apimock/base-client';
declare const client: Client; // match the global name.

it('...', () => {
   client.selectScenario(...); 
});
``` 

#### Report any issues
Please report any issue you find.