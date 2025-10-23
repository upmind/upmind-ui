[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / Upmind

# Upmind

The core Upmind class, responsible for initialising and orchestrating all
headless modules and plugins. It acts as a singleton entry point for
configuring the Upmind headless library within a Vue application.

## Constructors

### Constructor

```ts
new Upmind(): Upmind;
```

Constructs a new Upmind instance.
Initialises the Vue Query client.

#### Returns

`Upmind`

## Properties

### analytics

```ts
analytics: 
  | {
  debug?: boolean;
  enabled?: boolean;
  gtm?: {
     containerId?: string;
     dataLayer?: string;
  };
}
  | undefined;
```

Analytics configuration, typically for Google Tag Manager.

#### Type Declaration

```ts
{
  debug?: boolean;
  enabled?: boolean;
  gtm?: {
     containerId?: string;
     dataLayer?: string;
  };
}
```

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

`undefined`

***

### debug

```ts
debug: boolean | undefined;
```

Debugging flag for enabling various debug features.

***

### i18n

```ts
i18n: 
  | {
  debug?: boolean;
  files: GlobbedFiles;
  instance: I18n;
}
  | undefined;
```

Internationalization configuration for Vue I18n.

#### Type Declaration

```ts
{
  debug?: boolean;
  files: GlobbedFiles;
  instance: I18n;
}
```

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

`undefined`

***

### mode

```ts
mode: "default" | "express" | undefined = "default";
```

The operating mode of the Upmind instance ("default" or "express").

***

### plugins

```ts
plugins: 
  | Record<string, {
  options?: any;
  plugin: any;
}>
  | undefined = {};
```

A record of registered plugins.

***

### pop

```ts
pop: IApiPop | undefined;
```

Provider Of Providers (POP) API configuration.

***

### queryClient

```ts
queryClient: QueryClient;
```

The Vue Query client instance used for data fetching and caching.

***

### recaptcha

```ts
recaptcha: 
  | {
  enabled?: boolean;
  siteKey?: string;
}
  | undefined;
```

Google reCAPTCHA configuration.

#### Type Declaration

```ts
{
  enabled?: boolean;
  siteKey?: string;
}
```

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

`undefined`

***

### router

```ts
router: 
  | {
  flows?:   | Flow[]
     | () => Flow[];
  instance: Router;
}
  | undefined;
```

Vue Router configuration.

#### Type Declaration

```ts
{
  flows?:   | Flow[]
     | () => Flow[];
  instance: Router;
}
```

#### flows?

```ts
optional flows: 
  | Flow[]
  | () => Flow[];
```

An array of predefined routing flows or a function that returns them.

#### instance

```ts
instance: Router;
```

The Vue Router instance.

`undefined`

***

### status

```ts
status: Ref<UpmindStatus>;
```

Reactive reference to the current initialisation status of the Upmind instance.

***

### storefrontUrl?

```ts
optional storefrontUrl: string;
```

The base URL of the storefront application.

***

### themes?

```ts
optional themes: Theme[];
```

Theme configurations.

## Methods

### init()

```ts
init(props): Promise<void>;
```

Initialises the Upmind headless library with the provided configuration.
This method orchestrates the initialisation of all internal modules and plugins.

#### Parameters

##### props

[`UpmindProps`](../interfaces/UpmindProps.md)

An object containing initialisation properties.

#### Returns

`Promise`\<`void`\>

A promise that resolves when the Upmind instance is fully initialised.

#### Throws

If Upmind has already been initialised.

***

### isReady()

```ts
isReady(): Promise<void>;
```

Returns a promise that resolves when the Upmind instance has completed its
initialisation (status is `initialised` or `initialising`).
This method can be used to await the full readiness of the Upmind headless library.

#### Returns

`Promise`\<`void`\>

A promise that resolves when Upmind is initialised.
