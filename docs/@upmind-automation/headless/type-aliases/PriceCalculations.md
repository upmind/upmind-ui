[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / PriceCalculations

# PriceCalculations

```ts
type PriceCalculations = object;
```

Type alias for displaying price calculation states.

## Properties

### attributes?

```ts
optional attributes: number[];
```

An array of attribute IDs for which prices are calculated.

***

### calculating?

```ts
optional calculating: boolean;
```

`true` if prices are currently being calculated.

***

### options?

```ts
optional options: number[];
```

An array of option IDs for which prices are calculated.

***

### term?

```ts
optional term: number[];
```

An array of billing terms that prices are calculated for.
