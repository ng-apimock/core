A preset in [@ng-apimock/core](https://github.com/ng-apimock/core) is represented in a json file.
It allows you to set the state of one or multiple mocks and set variables all at once.

This can for instance be used to set all the mocks correctly for your happy or onhappy flow.

## Writing a preset file
Presets in [@ng-apimock/core](https://github.com/ng-apimock/core) are written in json.
There is only one rule to follow when writing a preset file.
1. It has a unique name


So writing a simple preset could look like this:
```json
{
    "name": "happy flow",
    "mocks": {
        "some mock": {
          "scenario": "ok",
          "delay": 3000
        }
      },
      "variables": {
        "something": "awesome"
      }
}
```
Writing a preset should always follow the [json schema](#json-schema).

## Actions
Selecting a preset can be done by using the [available clients](plugins).

## JSON schema
```json
{
    "$schema": "http://json-schema.org/draft-07/schema#",
    "description": "Preset",
    "properties": {
        "mocks": {
            "additionalProperties": {
                "$ref": "#/definitions/MockState"
            },
            "type": "object"
        },
        "name": {
            "type": "string"
        },
        "variables": {
            "additionalProperties": {
                "type": "string"
            },
            "type": "object"
        }
    },
    "required": ["name", "mocks", "variables"],
    "type": "object",
    "definitions": {
        "MockState": {
            "description": "Mock state",
            "properties": {
                "delay": {
                    "type": "number"
                },
                "echo": {
                    "type": "boolean"
                },
                "scenario": {
                    "type": "string"
                }
            },
            "type": "object"
        }
    }
}
```
