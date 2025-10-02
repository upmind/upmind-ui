[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / PriceDisplay

# PriceDisplay

```ts
type PriceDisplay = object;
```

The display price structure for any price that is displayed in the UI
We will always provide the price details:
   Based on the TOTAL CONFIGURATION which could be GROSS OR NET based on the Brands settings
   This would include quantity modifier, discounts, and any other adjustments
   Effectively this is the price that should be shown to the customer

## Properties

### currentAmount

```ts
currentAmount: number;
```

***

### currentPrice

```ts
currentPrice: string;
```

***

### monthlyFromCurrentAmount?

```ts
optional monthlyFromCurrentAmount: number;
```

***

### monthlyFromCurrentPrice?

```ts
optional monthlyFromCurrentPrice: string;
```

***

### monthlyFromRegularAmount?

```ts
optional monthlyFromRegularAmount: number;
```

***

### monthlyFromRegularPrice?

```ts
optional monthlyFromRegularPrice: string;
```

***

### regularAmount

```ts
regularAmount: number;
```

***

### regularPrice

```ts
regularPrice: string;
```

***

### savingAmount

```ts
savingAmount: number;
```

***

### savingPercent

```ts
savingPercent: string;
```

***

### savingPrice

```ts
savingPrice: string;
```
