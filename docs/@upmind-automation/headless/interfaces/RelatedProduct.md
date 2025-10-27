[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / RelatedProduct

# RelatedProduct

Interface representing a product that is related to another product, extending
`IRelatedObject` with additional display fields and augmented product data.
This is used to define and enrich connections between products for recommendations.

## Extends

- `IRelatedObject`

## Properties

### active

```ts
active: boolean;
```

#### Inherited from

```ts
IRelatedObject.active
```

***

### badge?

```ts
optional badge: Badge;
```

An optional badge to display with the related product.

***

### benefits?

```ts
optional benefits: Benefit[];
```

An array of benefits associated with the related product.

***

### config?

```ts
optional config: IProductConfig;
```

Optional product configuration (`IProductConfig`) that can be applied
when adding this related product as a recommendation.

***

### created\_at

```ts
created_at: string;
```

#### Inherited from

```ts
IRelatedObject.created_at
```

***

### deleted\_at

```ts
deleted_at: string | null;
```

#### Inherited from

```ts
IRelatedObject.deleted_at
```

***

### description

```ts
description: string | null;
```

#### Inherited from

```ts
IRelatedObject.description
```

***

### description\_translated

```ts
description_translated: string | null;
```

#### Inherited from

```ts
IRelatedObject.description_translated
```

***

### id

```ts
id: string;
```

#### Inherited from

```ts
IRelatedObject.id
```

***

### image?

```ts
optional image: IImage;
```

#### Inherited from

```ts
IRelatedObject.image
```

***

### image\_url?

```ts
optional image_url: string;
```

The URL for an image associated with the related product.

***

### label

```ts
label: string | null;
```

#### Inherited from

```ts
IRelatedObject.label
```

***

### label\_translated

```ts
label_translated: string | null;
```

#### Inherited from

```ts
IRelatedObject.label_translated
```

***

### name

```ts
name: string | null;
```

#### Inherited from

```ts
IRelatedObject.name
```

***

### name\_translated

```ts
name_translated: string;
```

#### Inherited from

```ts
IRelatedObject.name_translated
```

***

### object\_id

```ts
object_id: string;
```

#### Inherited from

```ts
IRelatedObject.object_id
```

***

### object\_type

```ts
object_type: string;
```

#### Inherited from

```ts
IRelatedObject.object_type
```

***

### order

```ts
order: number;
```

#### Inherited from

```ts
IRelatedObject.order
```

***

### product

```ts
product: IProduct;
```

The full `IProduct` object for the related product.

***

### product\_id

```ts
product_id: string;
```

#### Inherited from

```ts
IRelatedObject.product_id
```

***

### related\_object

```ts
related_object: IProduct | IProductCategory;
```

#### Inherited from

```ts
IRelatedObject.related_object
```

***

### short\_description?

```ts
optional short_description: string;
```

A short description of the related product.

***

### translations

```ts
translations: ITranslation[];
```

#### Inherited from

```ts
IRelatedObject.translations
```

***

### updated\_at

```ts
updated_at: string;
```

#### Inherited from

```ts
IRelatedObject.updated_at
```

***

### use\_object\_description?

```ts
optional use_object_description: boolean;
```

#### Inherited from

```ts
IRelatedObject.use_object_description
```
