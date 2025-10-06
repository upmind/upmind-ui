[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / usePlaces

# usePlaces()

```ts
function usePlaces(): object;
```

Hook to access Google Places API placess
This provides access to address searching and parsing functions.

## Returns

### getPlaceDetails()

```ts
getPlaceDetails: (id) => Promise<undefined | Place>;
```

Get details for a specific place from the placePredictions
This will return a parsed Place object with formatted address and coordinates

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`undefined` \| [`Place`](../type-aliases/Place.md)\>

### isReady()

```ts
isReady: () => Promise<boolean>;
```

Parse a place object into a more usable format

#### Returns

`Promise`\<`boolean`\>

Parsed place object with formatted address and coordinates

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
