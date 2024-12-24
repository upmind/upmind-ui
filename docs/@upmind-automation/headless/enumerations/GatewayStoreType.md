[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / GatewayStoreType

# GatewayStoreType

## Enumeration Members

### ALWAYS

```ts
ALWAYS: "always";
```

always (gateway does NOT support one-off payments; stored payment details only) - this is the case for GoCardless where an agreement (mandate) must be set up first

***

### EITHER

```ts
EITHER: "either";
```

either (gateway supports one-off payments + stored payment details)

***

### NONE

```ts
NONE: "none";
```

none (gateway does NOT support stored payment details)
