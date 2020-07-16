Makes sure that [@ng-apimock/core](https://github.com/ng-apimock/core) will log the request to the console.

## Usage
```typescript
echoRequest(name, indicator);
```
 
## Parameters
| Name | Type | Details |
| ---- | ---- | ------- |
| <code><var>name</var></code> | string | name of the mock |
| <code><var>indicator</var></code> | boolean | indicator to echo |
 
## Example 
```typescript
echoRequest('my-mock', true);
```
Executing this will log the request to the console for the mock matching the name `my-mock`.
