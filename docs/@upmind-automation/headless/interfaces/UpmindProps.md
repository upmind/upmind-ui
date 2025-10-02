[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / UpmindProps

# UpmindProps

## Properties

### analytics?

```ts
optional analytics: object;
```

#### debug?

```ts
optional debug: boolean;
```

#### enabled?

```ts
optional enabled: boolean;
```

#### gtm?

```ts
optional gtm: object;
```

##### gtm.containerId?

```ts
optional containerId: string;
```

##### gtm.dataLayer?

```ts
optional dataLayer: string;
```

***

### debug?

```ts
optional debug: boolean;
```

***

### i18n?

```ts
optional i18n: object;
```

#### debug?

```ts
optional debug: boolean;
```

#### files

```ts
files: GlobbedFiles;
```

#### instance

```ts
instance: I18n;
```

***

### mode?

```ts
optional mode: "default" | "express";
```

***

### plugins?

```ts
optional plugins: Record<string, {
  options?: any;
  plugin: any;
}>;
```

***

### pop?

```ts
optional pop: IApiPop;
```

***

### recaptcha?

```ts
optional recaptcha: object;
```

#### enabled?

```ts
optional enabled: boolean;
```

#### siteKey?

```ts
optional siteKey: string;
```

***

### router?

```ts
optional router: object;
```

#### flows?

```ts
optional flows: Flow[] | () => Flow[];
```

#### instance

```ts
instance: Router;
```

***

### storefrontUrl?

```ts
optional storefrontUrl: string;
```

***

### themes?

```ts
optional themes: Theme[];
```
