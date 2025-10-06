[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / parseBillingCycle

# parseBillingCycle()

```ts
function parseBillingCycle(months): object;
```

Maps a billing cycle duration in months to various descriptive formats.

## Parameters

### months

`number`

The duration of the billing cycle in months.

## Returns

`object`

An object with multiple representations of the billing cycle

### adverbial

```ts
adverbial: string;
```

### descriptive

```ts
descriptive: string;
```

### monthly

```ts
monthly: string;
```

### numeric

```ts
numeric: string;
```

### suffix

```ts
suffix: string = "";
```
