Returns all the recordings that [@ng-apimock/core](https://github.com/ng-apimock/core) has captured. In
order for recordings to be captured, make sure to enable the recording functionality.

## Usage

```typescript
getRecordings();
```

## Example

```typescript
getRecordings();
```

Executing this will return a list of recordings.

```json
{
  "recordings": {
    "some mock": [
      {
        "request": {
          "url": "/some/path/to",
          "method": "GET",
          "headers": {
            ...
          },
          "body": {}
        },
        "response": {
          "data": "[]",
          "status": 200,
          "headers": {
            ...
          }
        },
        "datetime": 1617704676136
      }
    ]
  },
  "record": true
}
```
