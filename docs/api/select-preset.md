Makes sure that [@ng-apimock/core](https://github.com/ng-apimock/core) preset is loaded.

## Usage
```typescript
selectPreset(name);
```

## Parameters
| Name | Type | Details |
| ---- | ---- | ------- |
| <code><var>name</var></code> | string | name of the preset |

## Example
```typescript
selectPreset('happy-flow'); 
```
Executing this will select preset `happy-flow`.
All the 
- mocks will be updated with the specified scenario's, delays and echo indicators.
- variables will be added / updated
