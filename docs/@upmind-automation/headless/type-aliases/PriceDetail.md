[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / PriceDetail

# PriceDetail

```ts
type PriceDetail = PriceDisplay & object;
```

The full price details for any product or item displayed in the UI.
This type extends [PriceDisplay](PriceDisplay.md) and provides additional breakdowns
for display and tracking purposes, including individual unit prices (gross and net)
and the total configuration price (gross and net).

## Type Declaration

### configuration?

```ts
optional configuration: Price;
```

The configuration price, representing the total price of the product,
including any adjustments or quantity modifiers.

### unit?

```ts
optional unit: Price;
```

The individual unit price, representing the base price of the product before
any adjustments or quantity modifiers.
