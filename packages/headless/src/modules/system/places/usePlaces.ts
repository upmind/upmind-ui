// --- external
import { Loader } from "@googlemaps/js-api-loader";
import { compact, find, isEmpty, isNil, map, reduce } from "lodash-es";

// --- internal
import { useQuery } from "../../query";
import { useSystem } from "..";

// --- utils
import { parsePlaces, usePlaceParser } from "./utils";

// --- types
import type {
  AutocompleteSuggestions,
  Place,
  PlacePrediction,
  PlacePredictions,
  PlaceService
} from "./types";
import {
  DetailedError,
  ErrorOrigin,
  responseCodes,
  useTime
} from "../../../utils";
import { computed, ref } from "vue";

// Private places instance
let places: PlaceService | undefined;

// -----------------------------------------------------------------------------

/**
 * Hook to access Google Places API placess
 * This provides access to address searching and parsing functions.
 */
export const usePlaces = () => {
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

  const { getRegions, getCountry, isReady: isSystemReady } = useSystem();
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

    // get our country and ensure we have regions for it
    const countryCode = getCountry(countryId)?.code;
    getRegions(countryCode);

    // Create a session token for this search session
    const sessionToken = new places.AutocompleteSessionToken();

    // Define the request parameters with the proper type
    const request: google.maps.places.AutocompleteRequest = {
      input: query,
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
    id: google.maps.places.Place["placeId"]
  ): Promise<Place | undefined> {
    if (!places)
      throw new DetailedError(
        "Places service not available",
        responseCodes.Not_Found,
        ErrorOrigin.External
      );

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
    search,

    /**
     * Get details for a specific place from the placePredictions
     * This will return a parsed Place object with formatted address and coordinates
     * @param place Place object to get details for
     */
    getPlaceDetails,

    /**
     * Parse a place object into a more usable format
     * @param place Place object to parse
     * @returns Parsed place object with formatted address and coordinates
     *
     */
    isReady,

    // ---
    predictions,
    suggestions: placePredictions
  };
};
