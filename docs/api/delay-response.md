Makes sure that [@ng-apimock/core](https://github.com/ng-apimock/core) returns the scenario response with the given delay for the request matching the mock

## Usage
```typescript
delayResponse(name, delay);
```
 
## Parameters
| Name | Type | Details |
| ---- | ---- | ------- |
| <code><var>name</var></code> | string | name of the mock |
| <code><var>delay</var></code> | number | milliseconds to delay |
 
## Example 
```typescript
delayResponse('my-mock', 3000);
```
Executing this will delay the response by `3000 ms` for the mock matching the name `my-mock`.
