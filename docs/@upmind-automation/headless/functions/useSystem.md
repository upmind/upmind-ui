[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useSystem

# useSystem()

```ts
function useSystem(): object;
```

The `useSystem` composable provides a simple interface to interact with the system API
and includes utility methods for fetching data.

## Returns

### billingCycles

```ts
billingCycles: ComputedRef<IBillingCycle[]>;
```

Computed property to the system's billing cycles.

### countries

```ts
countries: ComputedRef<ICountry[]>;
```

Computed property to the system's countries.

### currencies

```ts
currencies: ComputedRef<ICurrency[]>;
```

Computed property to the system's currencies.

### departments

```ts
departments: ComputedRef<ITicketDepartment[]>;
```

Computed property to the system's departments.

### errors

```ts
errors: ComputedRef<{
  billingCycles: undefined | null | Error;
  countries: undefined | null | Error;
  currencies: undefined | null | Error;
  departments: undefined | null | Error;
  languages: undefined | null | Error;
  statuses: undefined | null | Error;
}>;
```

Computed property to any errors encountered during the system state machine's process.

### fetchCountries()

```ts
fetchCountries: () => Promise<ICountry[]>;
```

Fetches the list of countries from the API or returns cached countries if available.

#### Returns

`Promise`\<`ICountry`[]\>

A promise resolving to the list of countries.

### fetchDepartments()

```ts
fetchDepartments: () => Promise<ITicketDepartment[]>;
```

Fetches the list of departments from the API or returns cached departments if available.

#### Returns

`Promise`\<`ITicketDepartment`[]\>

A promise resolving to the list of departments.

### fetchLanguages()

```ts
fetchLanguages: () => Promise<ILanguage[]>;
```

Fetches the list of languages from the API or returns cached languages if available.

#### Returns

`Promise`\<`ILanguage`[]\>

A promise resolving to the list of languages.

### fetchRegions()

```ts
fetchRegions: (country?) => Promise<IRegion[]>;
```

Fetches the regions for a given country from the API or returns cached regions if available.

#### Parameters

##### country?

The country object or code to fetch regions for.

`string` | `ICountry`

#### Returns

`Promise`\<`IRegion`[]\>

A promise resolving to the list of regions for the country.

### fetchStatuses()

```ts
fetchStatuses: () => Promise<IStatus[]>;
```

Fetches the list of statuses from the API or returns cached statuses if available.

#### Returns

`Promise`\<`IStatus`[]\>

A promise resolving to the list of statuses.

### getBillingCycle()

```ts
getBillingCycle: (value) => undefined | IBillingCycle;
```

Returns the billing cycle object for a given number of months.

#### Parameters

##### value

`number`

The number of months for the billing cycle.

#### Returns

`undefined` \| `IBillingCycle`

The matching billing cycle object, or undefined if not found.

### getCountry()

```ts
getCountry: (value?) => ICountry;
```

Returns the country object for a given country code or id.

#### Parameters

##### value?

The country code (2-letter) or id.

`null` | `string`

#### Returns

`ICountry`

The matching country object, or the default country if not found.

### getCurrency()

```ts
getCurrency: (value?) => undefined | ICurrency;
```

Returns the currency object for a given currency code or id.

#### Parameters

##### value?

`string`

The currency code (3-letter) or id.

#### Returns

`undefined` \| `ICurrency`

The matching currency object, or undefined if not found.

### getDepartment()

```ts
getDepartment: (value) => undefined | ITicketDepartment;
```

Returns the department object for a given department code.

#### Parameters

##### value

`string`

The department code.

#### Returns

`undefined` \| `ITicketDepartment`

The matching department object, or undefined if not found.

### getLanguage()

```ts
getLanguage: (value) => undefined | ILanguage;
```

Returns the language object for a given language code.

#### Parameters

##### value

`string`

The language code.

#### Returns

`undefined` \| `ILanguage`

The matching language object, or undefined if not found.

### getRegion()

```ts
getRegion: (values, country) => undefined | IRegion;
```

Returns a specific region object by name or array of names for a given country.

#### Parameters

##### values

The region name or array of region names.

`string` | `string`[]

##### country

The country object or code.

`string` | `ICountry`

#### Returns

`undefined` \| `IRegion`

The matching region object, or undefined if not found.

### getRegions()

```ts
getRegions: (country) => undefined | IRegion[];
```

Returns the regions for a given country from the context.

#### Parameters

##### country

`string` | `ICountry`

#### Returns

`undefined` \| `IRegion`[]

The regions array for the country, or undefined if not found.

### getStatus()

```ts
getStatus: (value) => undefined | IStatus;
```

Returns the status object for a given status code.

#### Parameters

##### value

`string`

The status code.

#### Returns

`undefined` \| `IStatus`

The matching status object, or undefined if not found.

### invalidate()

```ts
invalidate: () => void;
```

#### Returns

`void`

### isReady()

```ts
isReady: () => Promise<boolean>;
```

Resolves when the brand service is ready or errors.

#### Returns

`Promise`\<`boolean`\>

### languages

```ts
languages: ComputedRef<ILanguage[]>;
```

Computed property to the system's languages.

### meta

```ts
meta: ComputedRef<{
  hasError: ComputedRef<boolean>;
  isAvailable: boolean;
  isComplete: ComputedRef<boolean>;
  isEmpty: boolean;
  isLoading: ComputedRef<boolean>;
  isReady: boolean;
}>;
```

Meta-information about the system state.

### refresh()

```ts
refresh: () => Promise<void>;
```

#### Returns

`Promise`\<`void`\>

### statuses

```ts
statuses: ComputedRef<never[] | IStatus>;
```

Computed property to the system's statuses.
