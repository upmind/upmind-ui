[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / Theme

# Theme

Interface representing a complete theme configuration, combining a name,
optional icon, and specific UI and token settings.

## Properties

### icon?

```ts
optional icon: string;
```

An optional icon to represent the theme.

***

### id

```ts
id: string;
```

The unique identifier for the theme.

***

### name

```ts
name: string;
```

The name of the theme (e.g. "Dark Mode", "High Contrast").

***

### tokens?

```ts
optional tokens: string;
```

***

### uiConfig?

```ts
optional uiConfig: ThemeConfig;
```

Specific UI configuration overrides or settings for this theme, using [ThemeConfig](ThemeConfig.md).
