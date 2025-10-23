[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / PriceDisplay

# PriceDisplay

```ts
type PriceDisplay = object;
```

The display price structure for any price that is shown in the UI.
This structure always provides full price details based on the total configuration,
which may be gross or net depending on brand settings. It includes quantity modifiers,
discounts, and any other adjustments. Essentially, this is the final price that
should be presented to the customer.

## Properties

### currentAmount

```ts
currentAmount: number;
```

The current numerical amount of the price, *after* all applied coupons and discounts.

***

### currentPrice

```ts
currentPrice: string;
```

The current price, formatted as a string, *after* all applied coupons and discounts.

***

### monthlyFromCurrentAmount?

```ts
optional monthlyFromCurrentAmount: number;
```

The calculated monthly amount from the current price, if applicable.

***

### monthlyFromCurrentPrice?

```ts
optional monthlyFromCurrentPrice: string;
```

The calculated monthly price from the current price, formatted as a string, if applicable.

***

### monthlyFromRegularAmount?

```ts
optional monthlyFromRegularAmount: number;
```

The calculated monthly amount from the regular price, if applicable.

***

### monthlyFromRegularPrice?

```ts
optional monthlyFromRegularPrice: string;
```

The calculated monthly price from the regular price, formatted as a string, if applicable.

***

### regularAmount

```ts
regularAmount: number;
```

The regular numerical amount of the price *before* any coupons and discounts.

***

### regularPrice

```ts
regularPrice: string;
```

The regular price, formatted as a string, *before* any coupons and discounts.

***

### savingAmount

```ts
savingAmount: number;
```

The numerical amount saved due to discounts.

***

### savingPercent

```ts
savingPercent: string;
```

The saving amount, formatted as a percentage string (e.g. "10%").

***

### savingPrice

```ts
savingPrice: string;
```

The saving amount, formatted as a string.
