[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / UISchema

# UISchema

Interface representing a UI Schema for form rendering.
It provides configurations for billing, grouping, and other form-specific UI aspects.

## Properties

### billing?

```ts
optional billing: object;
```

Billing-specific control configuration.

#### control?

```ts
optional control: string;
```

The control type for billing.

***

### config?

```ts
optional config: object;
```

Configuration specific to the UI.

#### breadcrumbs?

```ts
optional breadcrumbs: BreadcrumbVariant;
```

#### summary?

```ts
optional summary: object;
```

Summary configuration.

##### summary.append?

```ts
optional append: string;
```

Optional string to append to the summary.

***

### group?

```ts
optional group: string;
```

The grouping identifier for form fields.

***

### group\_name?

```ts
optional group_name: string;
```

The display name of the group.

***

### icon?

```ts
optional icon: string;
```

The icon to display for the group.

***

### primary?

```ts
optional primary: boolean;
```

`true` if this schema is for a primary form.

***

### productConfig?

```ts
optional productConfig: object;
```

Product configuration summary settings.

#### summary?

```ts
optional summary: object;
```

Summary configuration.

##### summary.append?

```ts
optional append: string;
```

Optional string to append to the summary.
