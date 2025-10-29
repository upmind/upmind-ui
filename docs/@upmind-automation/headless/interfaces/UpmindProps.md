[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / UpmindProps

# UpmindProps

Interface defining the properties required to initialise the Upmind instance.
These properties configure various aspects of the headless library, including
mode, debugging, analytics, routing, internationalisation, and theming.

## Properties

### analytics?

```ts
optional analytics: object;
```

Configuration for analytics and tracking, primarily Google Tag Manager (GTM).

#### debug?

```ts
optional debug: boolean;
```

Enables debug mode for analytics.

#### enabled?

```ts
optional enabled: boolean;
```

Enables or disables analytics tracking.

#### gtm?

```ts
optional gtm: object;
```

GTM-specific configuration.

##### gtm.containerId?

```ts
optional containerId: string;
```

The GTM container ID (e.g., 'GTM-XXXXXXX').

##### gtm.dataLayer?

```ts
optional dataLayer: string;
```

The name of the dataLayer array, if different from 'dataLayer'.

***

### debug?

```ts
optional debug: boolean;
```

Enables debug mode for various components, including XState inspection.

#### Default

```ts
false (derived from session storage or default)
```

***

### i18n?

```ts
optional i18n: object;
```

Configuration for Vue I18n internationalization.

#### debug?

```ts
optional debug: boolean;
```

Enables debug mode for i18n.

#### files

```ts
files: GlobbedFiles;
```

Globbed files containing translation messages.

#### instance

```ts
instance: I18n;
```

The Vue I18n instance.

***

### mode?

```ts
optional mode: "default" | "express";
```

The operating mode of the Upmind instance.
- `default`: Standard operation with full headless module initialisation.
- `express`: A lighter mode, potentially skipping some render-blocking initialisations.

#### Default

```ts
"default"
```

***

### plugins?

```ts
optional plugins: Record<string, {
  options?: any;
  plugin: any;
}>;
```

A record of plugins to be registered with the Upmind instance.
Each entry specifies the plugin constructor and optional configuration.

#### Example

```ts
plugins: {
  myPlugin: { plugin: MyCustomPlugin, options: { foo: 'bar' } }
}
```

***

### pop?

```ts
optional pop: IApiPop;
```

Configuration for the POP (Provider Of Providers) API.

***

### recaptcha?

```ts
optional recaptcha: object;
```

Configuration for Google reCAPTCHA integration.

#### enabled?

```ts
optional enabled: boolean;
```

Enables or disables reCAPTCHA.

#### siteKey?

```ts
optional siteKey: string;
```

The reCAPTCHA site key.

***

### router?

```ts
optional router: object;
```

Configuration for Vue Router integration.

#### flows?

```ts
optional flows: Flow[] | () => Flow[];
```

An array of predefined routing flows or a function that returns them.

#### instance

```ts
instance: Router;
```

The Vue Router instance.

***

### storefrontUrl?

```ts
optional storefrontUrl: string;
```

The base URL of the storefront application. Used for generating absolute URLs
and linking purposes within the headless library.

***

### themes?

```ts
optional themes: Theme[];
```

An array of theme configurations to be loaded and managed by the theming module.
