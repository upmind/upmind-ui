[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / QueryResponse

# QueryResponse\<TData\>

Interface representing a standardised response structure from an API query.
It encapsulates the status, data, total count, error, and messages.

## Type Parameters

### TData

`TData` = `unknown`

The type of the main data payload (defaults to `unknown`).

## Properties

### data

```ts
data: TData | null;
```

The main data payload of the response, or `null` if an error occurred or no data.

***

### error

```ts
error: QueryResponseError | null;
```

An [QueryResponseError](QueryResponseError.md) object if an error occurred, or `null`.

***

### messages

```ts
messages: string[] | null;
```

An array of informational or success messages, or `null`.

***

### status

```ts
status: number;
```

The HTTP status code of the response.

***

### total

```ts
total: number | null;
```

The total number of items available, typically used for pagination, or `null`.
