[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / GlobbedFiles

# GlobbedFiles\<T\>

```ts
type GlobbedFiles<T> = 
  | Record<string, 
  | {
  default: Record<string, T>;
}
  | Record<string, T>>
| Record<string, () => Promise<T>>;
```

## Type Parameters

### T

`T` = `unknown`
