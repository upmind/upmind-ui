[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / Upmind

# Upmind

## Constructors

### Constructor

```ts
new Upmind(): Upmind;
```

#### Returns

`Upmind`

## Properties

### analytics

```ts
analytics: 
  | undefined
  | {
  debug?: boolean;
  enabled?: boolean;
  gtm?: {
     containerId?: string;
     dataLayer?: string;
  };
};
```

***

### debug

```ts
debug: undefined | boolean;
```

***

### i18n

```ts
i18n: 
  | undefined
  | {
  debug?: boolean;
  files: GlobbedFiles;
  instance: I18n;
};
```

***

### mode

```ts
mode: undefined | "default" | "express" = "default";
```

***

### plugins

```ts
plugins: 
  | undefined
  | Record<string, {
  options?: any;
  plugin: any;
}> = {};
```

***

### pop

```ts
pop: undefined | IApiPop;
```

***

### queryClient

```ts
queryClient: QueryClient;
```

***

### recaptcha

```ts
recaptcha: 
  | undefined
  | {
  enabled?: boolean;
  siteKey?: string;
};
```

***

### router

```ts
router: 
  | undefined
  | {
  flows?:   | Flow[]
     | () => Flow[];
  instance: Router;
};
```

***

### status

```ts
status: Ref<UpmindStatus>;
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

## Methods

### init()

```ts
init(__namedParameters): Promise<void>;
```

#### Parameters

##### \_\_namedParameters

[`UpmindProps`](../interfaces/UpmindProps.md)

#### Returns

`Promise`\<`void`\>

***

### isReady()

```ts
isReady(): Promise<void>;
```

#### Returns

`Promise`\<`void`\>
