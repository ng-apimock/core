A mock in [@ng-apimock/core](https://github.com/ng-apimock/core) is represented in a json/js file that follows the request / response principle.

## Writing a mock file
Mocks in [@ng-apimock/core](https://github.com/ng-apimock/core) are written in json or javascript.
There are a few rules to follow when writing a mock file.
1. It has a unique name
2. It has a request section that at least specifies a url and method
3. It has at least one response set to default: true

So writing a simple mock in json format could look like this:
```json
{
    "name": "some mock",
    "request": {
        "url": "/some/thing",
        "method": "GET"
    },
    "responses": {
        "ok": {
            "default": true,
            "data": {
                "some": "thing"
            }
        },
        "internal_server_error": {
            "status": 500
        }
    }   
}
```
or in javascript format like this:

```javascript
const data = require('./data.json');

module.exports = {
    "name": "some mock",
    "request": {
        "url": "/some/thing",
        "method": "GET"
    },
    "responses": {
        "ok": {
            "default": true,
            "data": {
                "some": data.some
            }   
        },
        "internal_server_error": {
            "status": 500
        }
    }   
};
```
Writing a mock should always follow the [json schema](#json-schema).

### Advanced request matching
When [@ng-apimock/core](https://github.com/ng-apimock/core) tries to match a request to a mock, it will always look at the required fields of the request.
But when the request is configured with the header and body, it will also use that information to match.

Looking at the following request configuration
```json
{
    "name": "some mock",
    "request": {
        "url": "^/some/thing$",
        "method": "POST",
        "headers": {
            "Content-Type": "application/json"
        },
        "body": {
            "item": "^[a-zA-Z]{3,10}$"
        }
    },
    "responses": {
        "ok": {
            "default": true
        },
        "internal_server_error": {
            "status": 500
        }
    }
}
```
the request will only match when the 
- Content-type header is of type 'application/json'
- The body contains an item that matches the regex

### Chaining responses
[@ng-apimock/core](https://github.com/ng-apimock/core) can also chain mock responses using then clauses.
When a mock is called and a then clause is provided, the clause will be checked. When the clause matches the current state, it will update the mocks accordingly.

Looking at the following response configuration
```json
{
    "name": "some mock",
    "request": {
        "url": "^/some/thing$",
        "method": "POST",
        "headers": {
            "Content-Type": "application/json"
        },
        "body": {
            "item": "^[a-zA-Z]{3,10}$"
        }
    },
    "responses": {
        "ok": {
            "default": true,
            "then": {
                "mocks": [ { 
                    "name": "some-mock", // optional, defaults to the current mock
                    "scenario": "internal_server_error"
                }, { 
                    "name": "some-other-mock", 
                    "scenario": "some-scenario"
                }],
                "times": 3 // optional
            }
        }
    },
    "internal_server_error": {
        "status": 500
    }
}
```

When this mock is called 3 times, 2 things will happen for each mock in the list:
1. the scenario will be selected.
2. the counter will be reset to 0 

So for:
- the mock with name `some-mock` the `internal_server_error` scenario will be selected.
- the mock with name `some-other-mock` the `some-scenario` scenario will be selected.

### Returning file data
[@ng-apimock/core](https://github.com/ng-apimock/core) also has the ability to return a file instead of data.
This can be very handy when you share files between mocks.

Looking at the following response 
```json
{
    "name": "some mock",
    "request": {
        "url": "/some/thing",
        "method": "GET"
    },
    "responses": {
        "ok": {
            "default": true,
            "file": "some.csv",
            "headers": {
                "Content-type": "text/plain",
                "filename": "some.csv"
            }
        },
        "internal_server_error": {
            "status": 500
        }
    }   
}
```

The response will return the csv file `some.csv` with the specified headers.
:::note 

The file will be resolved relative to the location of the mock file.

:::

## Actions
Selecting a scenario, delaying a response or echoing a request can be done by using the [available clients](plugins).

## JSON schema
```json
{
    "$schema": "http://json-schema.org/draft-07/schema#",
    "description": "Mock.",
    "properties": {
        "name": {
            "type": "string"
        },
        "isArray": {
            "type": "boolean"
        },
        "delay": {
            "type": "number"
        },
        "request": {
            "$ref": "#/definitions/MockRequest"
        },
        "responses": {
            "additionalProperties": {
                "$ref": "#/definitions/MockResponse"
            },
            "type": "object"
        }
    },
    "required": ["name", "request", "responses"],
    "type": "object",
    "definitions": {
        "MockRequest": {
            "description": "Mock request.",
            "properties": {
                "url": {
                    "type": "string"
                },
                "method": {
                    "enum": [
                        "GET",
                        "HEAD",
                        "OPTIONS",
                        "POST",
                        "PUT",
                        "DELETE"
                    ],
                    "type": "string"
                },
                "body": {
                    "type": "object"
                },
                "headers": {
                    "type": "object"
                }
            },
            "required": ["url", "method"],
            "type": "object"
        },
        "MockResponse": {
            "description": "Mock response.",
            "properties": {
                "data": {
                    "anyOf": [
                        {
                            "type": "object"
                        },
                        {
                            "items": [
                                {
                                    "type": "object"
                                }
                            ],
                            "minItems": 1,
                            "type": "array"
                        }
                    ]
                },
                "default": {
                    "type": "boolean"
                },
                "file": {
                    "type": "string"
                },
                "headers": {
                    "additionalProperties": {
                        "type": "string"
                    },
                    "type": "object"
                },
                "status": {
                    "type": "number"
                },
                "statusText": {
                    "type": "string"
                },
                "then": {
                    "$ref": "#/definitions/MockResponseThenClause"
                }
            },
            "type": "object"
        },
        "MockResponseThenClause": {
            "properties": {
                "criteria": {
                    "$ref": "#/definitions/MockResponseThenClauseCriteria"
                },
                "mocks": {
                    "items": {
                        "$ref": "#/definitions/MockResponseThenClauseMockSelection"
                    },
                    "minItems": 1,
                    "type": "array"
                }
            },
            "required": ["mocks"],
            "type": "object"
        },
        "MockResponseThenClauseCriteria": {
            "properties": {
                "times": {
                    "type": "number"
                }
            },
            "required": ["times"],
            "type": "object"
        },
        "MockResponseThenClauseMockSelection": {
            "properties": {
                "name": {
                    "type": "string"
                },
                "scenario": {
                    "type": "string"
                }
            },
            "required": ["scenario"],
            "type": "object"
        }
    }
}
```
