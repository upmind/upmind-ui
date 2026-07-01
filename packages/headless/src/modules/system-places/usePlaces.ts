import { Loader } from "@googlemaps/js-api-loader";
import { ref } from "vue";
import { useSystem } from "../system";
import { useLocale } from "../system-localisation";
import { parsePlaces, usePlaceParser } from "./system-places.utils";
import { DEBOUNCE_DELAY } from "../../utils";
import {
  compact,
  debounce,
  find,
  isEmpty,
  isNil,
  map,
  reduce
} from "lodash-es";
import type {
  Place,
  PlacePrediction,
  PlacePredictions,
  PlaceService
} from "./system-places.types";

// Private places instance
let places: PlaceService | undefined;

// -----------------------------------------------------------------------------

/**
 * Composable function to provide utility methods and state for integrating with
 * the Google Places API. It initialises the Places API, manages its readiness state,
 * and offers features for searching address predictions, retrieving place details,
 * and accessing prediction results.
 */
export const usePlaces = () => {
  const { locale } = useLocale();

  // If we dont have a places, load it
  if (!places) {
    // Otherwise create a new places
    const loader = new Loader({
      apiKey: import.meta.env.VITE_APP_GOOGLE_MAPS_API_KEY,
      version: "weekly"
    });

    loader
      .importLibrary("places")
      .then(parsePlaces)
      .then(service => (places = service));
  }

  const {
    getRegions,
    getCountry,
    ensureCountries,
    isReady: isSystemReady
  } = useSystem();
  // --- state

  async function isReady(): Promise<boolean> {
    return isSystemReady().then(
      async () =>
        new Promise<boolean>(resolve => {
          const interval = setInterval(() => {
            if (!isNil(places)) {
              clearInterval(interval);
              resolve(true);
            }
          }, 100);
        })
    );
  }

  const placePredictions = ref<PlacePredictions>([]);
  const predictions = ref<PlacePrediction[]>([]);

  async function search(
    query: string,
    countryId?: string
  ): Promise<PlacePredictions> {
    // Return early if the query is empty or places is not ready
    if (!places || isEmpty(query)) return [];

    // Ensure countries are loaded before accessing getCountry
    await ensureCountries();

    // get our country and ensure we have regions for it
    const countryCode = getCountry(countryId)?.code;
    getRegions(countryCode);

    // Create a session token for this search session
    const sessionToken = new places.AutocompleteSessionToken();

    // Define the request parameters with the proper type
    const request: google.maps.places.AutocompleteRequest = {
      input: query,
      language: locale.value,
      sessionToken,
      ...(countryCode && { includedRegionCodes: [countryCode] })
    };

    // Get the predictions using the new API

    return places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
      request
    ).then(response => {
      placePredictions.value = compact(
        map(response.suggestions, "placePrediction")
      );

      predictions.value = reduce(
        response.suggestions,
        (
          result: PlacePrediction[],
          suggestion: google.maps.places.AutocompleteSuggestion
        ) => {
          const placePrediction = suggestion.placePrediction;
          const item = {
            id: placePrediction?.placeId,
            label: placePrediction?.text.toString()
          } as PlacePrediction;
          if (placePrediction) result.push(item);
          return result;
        },
        [] as PlacePrediction[]
      );

      return placePredictions.value;
    });
  }

  async function getPlaceDetails(
    id: google.maps.places.PlacePrediction["placeId"]
  ): Promise<Place | undefined> {
    if (!places) return Promise.resolve(undefined);

    const prediction = find(placePredictions.value, ["placeId", id]);

    if (!prediction) return Promise.resolve(undefined);

    // Fetch the prediction details using the new API
    return prediction
      .toPlace()
      .fetchFields({
        fields: [
          "id",
          "displayName",
          "addressComponents",
          "formattedAddress",
          "location"
        ]
      })
      .then(({ place }) => usePlaceParser(place));
  }

  // ---------------------------------------------------------------------------

  return {
    /**
     * Search for address placePredictions based on user input
     * @param query Text to search for
     * @param countryCode Optional country id to restrict results
     * @returns Promise with array of address placePredictions
     */
    search: debounce(search, DEBOUNCE_DELAY),

    /**
     * Get details for a specific place from the placePredictions
     * This will return a parsed Place object with formatted address and coordinates
     * @param place Place object to get details for
     */
    getPlaceDetails,

    /**
     * Check if the places service is ready
     * @returns Promise that resolves to true if ready
     */
    isReady,

    // ---
    predictions,
    suggestions: placePredictions
  };
};
