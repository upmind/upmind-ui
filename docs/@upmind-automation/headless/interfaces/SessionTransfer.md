[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / SessionTransfer

# SessionTransfer

Interface representing the details of an active or pending session transfer.

## Properties

### code

```ts
code: string | null;
```

The transfer code used to initiate or identify the session transfer.

***

### redirect

```ts
redirect: string | null;
```

The redirect URL associated with the transfer, if any.

***

### token?

```ts
optional token: string | null;
```

An optional authentication token provided as part of the transfer process.
