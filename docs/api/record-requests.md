Enable / disable the recording of requests/responses that [@ng-apimock/core](https://github.com/ng-apimock/core) has made.

## Usage

```typescript
recordRequests(true); // default behaviour is false
```

## Example

```typescript
recordRequests(true);
```

Executing this will record the requests/responses. They can be retrieved using [get-recordings](get-recordings).
