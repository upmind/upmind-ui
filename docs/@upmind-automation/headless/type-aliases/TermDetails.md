[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / TermDetails

# TermDetails

```ts
type TermDetails = ProductSummaryDetail & object;
```

Type alias for term-specific details in a product summary, including pricing and tax display options.

## Type Declaration

### price

```ts
price: PriceDetail;
```

The detailed price information for the term.

### showTaxes?

```ts
optional showTaxes: boolean;
```

`true` if taxes should be explicitly shown for this term.
