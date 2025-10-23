[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / handleError

# handleError()

```ts
function handleError(status, error): Promise<never>;
```

Handles errors from a query response by displaying a user-friendly feedback message
and then throwing a `DetailedError` for programmatic handling.

## Parameters

### status

`number`

The HTTP status code from the query response.

### error

The [QueryResponseError](../interfaces/QueryResponseError.md) object from the query response.

[`QueryResponseError`](../interfaces/QueryResponseError.md) | `null`

## Returns

`Promise`\<`never`\>

A promise that always rejects with a DetailedError, containing the mapped message and originating details.

## Throws

Throws a detailed error instance based on the provided status and error object.
