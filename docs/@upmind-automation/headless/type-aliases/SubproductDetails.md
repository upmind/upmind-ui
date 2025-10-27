[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / SubproductDetails

# SubproductDetails

```ts
type SubproductDetails = object;
```

Type alias for detailed information about a subproduct.

## Properties

### description?

```ts
optional description: string;
```

A detailed description of the subproduct.

***

### excerpt?

```ts
optional excerpt: string;
```

A short excerpt or summary of the subproduct description.

***

### id

```ts
id: string;
```

The unique identifier of the subproduct.

***

### meta

```ts
meta: object;
```

Meta-information about the subproduct's behaviour.

#### multiple

```ts
multiple: boolean;
```

`true` if multiple instances of this subproduct can be selected.

#### overrides

```ts
overrides: boolean;
```

`true` if this subproduct selection overrides a default.

#### required

```ts
required: boolean;
```

`true` if selection of this subproduct is required.

***

### name

```ts
name: string;
```

The untranslated name of the subproduct, often used for reporting purposes.

***

### title

```ts
title: string;
```

The display title of the subproduct, typically translated.

***

### uiCategoryMeta?

```ts
optional uiCategoryMeta: Record<string, any>;
```

Optional UI meta-data specific to the subproduct's category.

***

### uiMeta?

```ts
optional uiMeta: Record<string, any>;
```

Optional UI meta-data specific to the subproduct.

***

### values?

```ts
optional values: SubproductValue[];
```

An array of [SubproductValue](SubproductValue.md) objects representing the available choices for this subproduct.
