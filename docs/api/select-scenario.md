Makes sure that [@ng-apimock/core](https://github.com/ng-apimock/core) returns the given scenario for the request matching the mock.

## Usage
```typescript
selectScenario(name, scenario);
```

## Parameters
| Name | Type | Details |
| ---- | ---- | ------- |
| <code><var>name</var></code> | string | name of the mock |
| <code><var>scenario</var></code> | string | name of the scenario |

## Example
```typescript
selectScenario('my-mock', 'my-awesome-scenario'); 
```
Executing this will select scenario `my-awesome-scenario` for the mock matching the name `my-mock`.


## PassThrough
There is one special scenario called `passThrough`.
When this scenario is selected, the request will be passed through to the actual backend.

:::note

When calling **selectScenario** without a scenario, it will recognize it as **passThrough**.

:::


