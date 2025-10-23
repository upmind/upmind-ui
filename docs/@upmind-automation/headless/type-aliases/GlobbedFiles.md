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

Type alias representing the structure of files loaded via a glob import
in a JavaScript/TypeScript module system (e.g. Vite's `import.meta.glob`).
This type is flexible to accommodate different glob import patterns,
either direct message objects or dynamic import functions.

## Type Parameters

### T

`T` = `unknown`

The type of the translation messages, typically a `Record<string, string>`.
