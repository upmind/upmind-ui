[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / PriceDetail

# PriceDetail

```ts
type PriceDetail = PriceDisplay & object;
```

The price details for any price that is displayed in the UI
We also provide all the necessary price breakdowns for display and tracking purposes
The Individual unit price, both gross and net:
   Individual unit prices are the base price of the product, before any adjustments or quantity modifiers
The Configuration price, both gross and net:
   Configuration prices are the total price of the product, including any adjustments or quantity modifiers

## Type Declaration

### configuration?

```ts
optional configuration: Price;
```

### unit?

```ts
optional unit: Price;
```
