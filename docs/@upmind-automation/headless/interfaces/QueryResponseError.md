[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / QueryResponseError

# QueryResponseError

Interface representing a structured error response from an API query.

## Properties

### code

```ts
code: string | number;
```

A code identifying the type of error (e.g. "INVALID_INPUT", `responseCodes.BadRequest`).

***

### data

```ts
data: any;
```

Optional additional data related to the error, e.g. validation specifics.

***

### id

```ts
id: null;
```

An optional unique identifier for the error, typically `null` if not specified.

***

### message

```ts
message: string;
```

A human-readable message describing the error.

***

### status

```ts
status: number;
```

The HTTP status code associated with the error (e.g. 400, 500).

***

### type

```ts
type: string | number;
```

The type of the error, often mirroring the `code`.
