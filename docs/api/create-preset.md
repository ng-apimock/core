Makes sure that [@ng-apimock/core](https://github.com/ng-apimock/core) a new preset will be created.

## Usage
```typescript
createPreset(name, includeMocks, includeVariables);
```

## Parameters
| Name | Type | Details |
| ---- | ---- | ------- |
| <code><var>name</var></code> | string | name of the preset |
| <code><var>includeMocks</var></code> | boolean | include current mock state |
| <code><var>includeVariables</var></code> | boolean | include current variables |

## Example
```typescript
createPreset('awesome-flow', true, true); 
```
Executing this will create a preset `awesome-flow`.
When including mocks, the current state of the mocks will be used in the preset.
When including variables, the current variables will be used in the preset.

You need to at least include mocks or variables, otherwise the preset will not be created. 
