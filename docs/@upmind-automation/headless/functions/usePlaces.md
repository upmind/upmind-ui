[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / usePlaces

# usePlaces()

```ts
function usePlaces(): object;
```

Composable function to provide utility methods and state for integrating with
the Google Places API. It initialises the Places API, manages its readiness state,
and offers features for searching address predictions, retrieving place details,
and accessing prediction results.

## Returns

### getPlaceDetails()

```ts
getPlaceDetails: (id) => Promise<Place | undefined>;
```

Get details for a specific place from the placePredictions
This will return a parsed Place object with formatted address and coordinates

#### Parameters

##### id

`string`

#### Returns

`Promise`\<[`Place`](../type-aliases/Place.md) \| `undefined`\>

### isReady()

```ts
isReady: () => Promise<boolean>;
```

Check if the places service is ready

#### Returns

`Promise`\<`boolean`\>

Promise that resolves to true if ready

### predictions

```ts
predictions: Ref<object[], PlacePrediction[] | object[]>;
```

### search

```ts
search: DebouncedFunc<(query, countryId?) => Promise<PlacePredictions>>;
```

Search for address placePredictions based on user input

#### Param

Text to search for

#### Param

Optional country id to restrict results

#### Returns

Promise with array of address placePredictions

### suggestions

```ts
suggestions: Ref<object[], PlacePredictions | object[]> = placePredictions;
```
