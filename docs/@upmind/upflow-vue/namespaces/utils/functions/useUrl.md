[Upmind](../../../../packages.md) / [@upmind/upflow-vue](../../../index.md) / [utils](../index.md) / useUrl

# useUrl()

```ts
function useUrl(
   path, 
   params, 
   instance?): URL
```

Constructs a URL with the given path and query parameters.

## Parameters

• **path**: `string`

The path to append to the base URL.

• **params**: `Object` = `{}`

The query parameters to include in the URL.

• **instance?**

• **instance.base?**: `string`

• **instance.context?**: `string`

## Returns

`URL`

The constructed URL as a string.
