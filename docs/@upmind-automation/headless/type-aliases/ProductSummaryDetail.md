[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / ProductSummaryDetail

# ProductSummaryDetail

```ts
type ProductSummaryDetail = object;
```

Type alias for a product summary detail, providing name, title, cycle, and meta-information.

## Properties

### category?

```ts
optional category: string;
```

The category name of the item.

***

### cycle?

```ts
optional cycle: number;
```

The billing cycle duration in months for the item.

***

### error?

```ts
optional error: ValidationErrorObject[];
```

Optional array of Ajv [ErrorObject](../interfaces/ValidationErrorObject.md) if there are validation errors.

***

### meta

```ts
meta: ProductSummaryMeta;
```

Meta-information about this summary detail.

***

### name

```ts
name: string;
```

The untranslated name of the item, often used for reporting purposes.

***

### promotions?

```ts
optional promotions: PromotionDetails[];
```

An array of [PromotionDetails](PromotionDetails.md) applied to this item.

***

### quantity?

```ts
optional quantity: number;
```

The quantity of the item.

***

### title?

```ts
optional title: string;
```

The display title of the item, typically translated.
