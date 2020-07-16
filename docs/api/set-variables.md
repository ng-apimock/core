Makes sure that [@ng-apimock/core](https://github.com/ng-apimock/core) will add or update the variables.

## Usage
```typescript
setVariables(variables);
```
 
## Parameters
| Name | Type | Details |
| ---- | ---- | ------- |
| <code><var>variables</var></code> | object | the key/value object |
 
## Example 
```typescript
setVariables({
    now: new Date().getTime(), 
    hello: 'hi'
});
```
Executing this will add the variables with:
 - key `now` and value `the current date time`
 - key `hello` and value `hi`
 
These variables will be used to interpolated with the mock response.
