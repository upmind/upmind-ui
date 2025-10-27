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

### errors

```ts
errors: ComputedRef<{
  billingCycles: Error | null;
  countries: Error | null;
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

### getBillingCycle()

```ts
getBillingCycle: (value) => IBillingCycle | undefined;
```

Returns the billing cycle object for a given number of months.

#### Parameters

##### value

`number`

The number of months for the billing cycle.

#### Returns

`IBillingCycle` \| `undefined`

The matching billing cycle object, or undefined if not found.

### getCountry()

```ts
getCountry: (value?) => ICountry;
```

Returns the country object for a given country code or id.

#### Parameters

##### value?

The country code (2-letter) or id.

`string` | `null`

#### Returns

`ICountry`

The matching country object, or the default country if not found.

### getRegion()

```ts
getRegion: (values, country) => IRegion | undefined;
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

`IRegion` \| `undefined`

The matching region object, or undefined if not found.

### getRegions()

```ts
getRegions: (country) => IRegion[] | undefined;
```

Returns the regions for a given country from the context.

#### Parameters

##### country

`string` | `ICountry`

#### Returns

`IRegion`[] \| `undefined`

The regions array for the country, or undefined if not found.

### invalidate()

```ts
invalidate: () => void;
```

Invalidates all system-related queries in the cache, forcing them to refetch on next access.

#### Returns

`void`

### isReady()

```ts
isReady: () => Promise<boolean>;
```

Resolves when the brand service is ready or errors.

#### Returns

`Promise`\<`boolean`\>

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

Refreshes all system-related queries to fetch the latest data from the API.

#### Returns

`Promise`\<`void`\>
