[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / Place

# Place

```ts
type Place = object;
```

Represents a geographical place with basic identification and address details.
This structure is used for displaying search results or selected locations.

## Properties

### address

```ts
address: AddressModel["address"];
```

The detailed address components of the place.

***

### description

```ts
description: string;
```

A descriptive string or short summary about the place.

***

### id

```ts
id: string;
```

A unique identifier for the place.

***

### title

```ts
title: string;
```

The display title or name of the place (e.g. "Eiffel Tower", "London Office").
