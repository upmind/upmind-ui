[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / DataLayerPage

# DataLayerPage

Interface representing page-specific data to be pushed to the data layer.
This helps track navigation, page views, and contextual information about the current page.

## Properties

### current\_url?

```ts
optional current_url: string;
```

The full URL of the current page.

***

### environment?

```ts
optional environment: string;
```

The environment in which the page is loaded (e.g. "production", "development", "staging").

***

### language?

```ts
optional language: string;
```

The language of the page content (e.g. "en-GB", "es").

***

### page\_type?

```ts
optional page_type: string;
```

The type of the current page (e.g. "product_detail", "category", "checkout").

***

### previous\_url?

```ts
optional previous_url: string;
```

The full URL of the previous page, if known.

***

### version?

```ts
optional version: string;
```

The version of the application or page template.
