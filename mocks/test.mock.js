const data = require('./data.json');

module.exports = {
  "name": new Date().toISOString(),
  "request": {
    "url": "/graphql2",
    "method": "POST"
  },
  "responses": {
    "okResponse": {
      "default": true,
      "status": 200,
      "headers": {
        "Content-Type": "application/json"
      },
      "data": data
    },
    "errorResponse": {
      "status": 500
    },
    "loadingResponse": {
      "status": 200,
      "headers": {
        "Content-Type": "application/json"
      },
      "data": {
        "time": "MOCK TIME AFTER DELAY!!"
      },
      "delay": 10000
    }
  }
}