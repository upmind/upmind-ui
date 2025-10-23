[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useTransfer

# useTransfer()

```ts
function useTransfer(): object;
```

Composable function to manage session-related logic using Vue.
It provides state, context and helpers for session, login and registration processes.

## Returns

The [UseTransfer](../type-aliases/UseTransfer.md) session management API (see below for details)

### transferFrom()

```ts
transferFrom: () => Promise<boolean> = transfer;
```

Transfers the session and handles redirect logic.

Session transfer function.
This function is responsible for transferring session data between different parts of the application.
It handles the transfer code and redirect URL, and ensures that the session is properly initialized.

#### Returns

`Promise`\<`boolean`\>

A promise that resolves when the transfer is complete.

#### Returns

A promise that resolves when the transfer is complete.
