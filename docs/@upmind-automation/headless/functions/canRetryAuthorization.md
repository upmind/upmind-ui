[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / canRetryAuthorization

# canRetryAuthorization()

```ts
function canRetryAuthorization(
   url, 
   error, 
   options): boolean;
```

Determines if an authorisation retry is permissible based on the URL, error details, and attempt count.
This function is primarily used for handling authentication-related errors, such as expired tokens or unauthorised access.

## Parameters

### url

`URL`

The URL of the request that resulted in an error.

### error

`DetailedError`

The DetailedError object containing details about the error.

### options

An object containing the current attempt count and the maximum allowed attempts.

#### attempts

`number`

The number of attempts already made for this request.

#### max

`number`

The maximum number of retries allowed.

## Returns

`boolean`

`true` if an authorisation retry is allowed, `false` otherwise.
