# Using @ng-apimock/core with angular-cli

In order to use @ng-apimock/core you need to do 3 things:
1. install ng-apimock
2. serve the mocks
3. proxy the api requests to served mocks
4. update your npm start script
 
## 1. Install ng-apimock
 
Using npm
 ```javascript
npm install --save-dev @ng-apimock/core
```

Using yarn
```javascript
yarn add @ng-apimock/core --dev
```
 
## 2. Serve the mocks
In order to serve the mocks using @ng-apimock/core you need to start an express server.
Express is already available as it is a dependency of angular-cli / webpack-dev-server.

Create a **server.js** file and copy paste the snippet below:
 ```javascript
const apimock = require('@ng-apimock/core');
const express = require('express');
const path = require('path');
const app = express();

app.set('port', (process.env.PORT || 3000));

// Process the application mocks
apimock.processor.process({src: 'path/to/my/mocks'})
// Use the ng-apimock middelware
app.use(apimock.middleware);

app.listen(app.get('port'), function() {
  console.log('app running on port', app.get('port'));
});
```

## 3. Proxy the requests
In order to proxy the requests for the api and /mocking interface you need to create a proxy file.

Create a **proxy.config.json** file and copy paste the snippet below:
 ```json
 {
  "/api/*": {
    "target": "http://localhost:3000",
    "secure": false,
    "logLevel": "debug"
  },
  "/ngapimock/*": {
     "target": "http://localhost:3000",
     "secure": false,
     "logLevel": "debug"
   }
 }
 ```
 
## 4. Update your npm start script
We need to let ng-serve know that it should use the proxy config. Therefore in package.json the following line:
 ```json
"scripts": {
  "start": "ng serve"
}
 ```
needs to be changed to
```json
"scripts": {
  "start": "ng serve --proxy-config proxy.config.json"
}
```
 
 
Your api calls are now proxied to @ng-apimock/core on http://localhost:3000.
