[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / handleError

# handleError()

```ts
function handleError(status, error): Promise<never>;
```

Handles errors from a query response by displaying a feedback message and throwing a detailed error.

## Parameters

### status

`number`

The status code from the query response.

### error

The error object from the query response.

`null` | [`QueryResponseError`](../interfaces/QueryResponseError.md)

## Returns

`Promise`\<`never`\>

A promise that never resolves, as it always throws an error.

## Throws

Throws a detailed error containing the error message, status, origin, and additional data.
