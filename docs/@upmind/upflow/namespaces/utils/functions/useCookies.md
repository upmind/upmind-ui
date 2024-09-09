[Upmind](../../../../packages.md) / [@upmind/upflow](../../../index.md) / [utils](../index.md) / useCookies

# useCookies()

```ts
function useCookies(): object
```

## Returns

`object`

### deleteCookie()

```ts
deleteCookie: (name) => void;
```

#### Parameters

• **name**: `string`

#### Returns

`void`

### getCookie()

```ts
getCookie: (name) => Promise<unknown>;
```

#### Parameters

• **name**: `string`

#### Returns

`Promise`\<`unknown`\>

### setCookie()

```ts
setCookie: (name, value, maxAge) => void;
```

#### Parameters

• **name**: `string`

• **value**: `any`

• **maxAge**: `number`

#### Returns

`void`
