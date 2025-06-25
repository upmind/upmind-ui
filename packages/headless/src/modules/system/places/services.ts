// --- external
import { Loader } from "@googlemaps/js-api-loader";
import { compact, isArray, isEmpty, isNil, map } from "lodash-es";

// --- internal
import { useQuery } from "../../query";
import { useSystem } from "..";

// --- utils
import { parsePlaces, usePlaceParser } from "./utils";

// --- types
import type { Place, PlaceService } from "./types";
import { useTime } from "src/utils";

// Private service instance
let service: PlaceService | undefined;

/**
 * Initialize the Google Places API and return the service
 */
async function load(): Promise<PlaceService> {
  // If we already have a service, return it
  if (service) return service;

  // Otherwise create a new service
  const loader = new Loader({
    apiKey: import.meta.env.VITE_APP_GOOGLE_MAPS_API_KEY,
    version: "weekly",
  });

  return loader
    .importLibrary("places")
    .then(parsePlaces)
    .then(async s => {
      service = s;
      await useSystem().isReady();
      return service;
    });
}

/**
 * Check if the Places service is ready
 * This is useful to ensure the service is loaded before using it
 * @returns Promise that resolves to the PlaceService instance
 */
async function isReady(): Promise<PlaceService> {
  return new Promise(resolve =>
    setTimeout(() => {
      if (!isNil(service)) {
        resolve(service);
      }
    }, 100)
  );
}

/**
 * Search for address suggestions based on user input and return parsed address details
 * @param query Text to search for
 * @param countryId Optional country id to restrict results
 * @returns Promise with an array of parsed address details only
 */
async function search(query: string, countryId?: string): Promise<Place[]> {
  const { queryClient } = useQuery();

  // Return early if the query is empty
  if (isEmpty(query)) return [];

  const countryCode = countryId
    ? useSystem().getCountry(countryId)?.code
    : null;

  // Generate a cache key based on the search query and country
  const queryKey = ["places", "search", query, countryCode];

  return queryClient.fetchQuery<Place[]>({
    queryKey,
    queryFn: async () => {
      const places = await load();

      // Create a session token for this search session
      const sessionToken = new places.AutocompleteSessionToken();

      // Define the request parameters with the proper type
      const request: google.maps.places.AutocompleteRequest = {
        input: query,
        sessionToken,
        ...(countryCode && { includedRegionCodes: [countryCode] }),
      };

      try {
        // Get the predictions using the new API
        const { suggestions } =
          await places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
            request
          );

        // If no suggestions, return an empty array
        if (!isArray(suggestions) || isEmpty(suggestions)) return [];

        // Parse all predictions and compact the results to remove nulls
        return Promise.all(
          map(suggestions, async suggestion => {
            try {
              if (!suggestion.placePrediction) {
                return null;
              }

              const placeId = suggestion.placePrediction.placeId;
              if (!placeId) {
                return null;
              }

              return await parse(placeId);
            } catch (error) {
              // console.error(`Failed to parse address from prediction:`, error);
              return null;
            }
          })
        ).then(compact);
      } catch (error) {
        // console.error("Error fetching autocomplete suggestions:", error);
        return [];
      }
    },
    // Cache search results for 5 minutes
    staleTime: useTime().MINUTE * 5,
  });
}

/**
 * Get full details for a place by its ID
 * @param placeId Google Places ID
 * @returns Promise with address details or null
 */
async function parse(placeId: string): Promise<Place | null> {
  if (isEmpty(placeId)) return null;
  if (placeId === "manual") return null;

  const { queryClient } = useQuery();

  // Generate a cache key for caching purposes
  const queryKey = ["places", "details", placeId];

  return queryClient.fetchQuery<Place | null>({
    queryKey,
    queryFn: async () => {
      const placeLibrary = await load();

      try {
        // Create a new Place instance using the place ID
        const place = new placeLibrary.Place({ id: placeId });

        // Specify which fields to fetch
        await place.fetchFields({
          fields: [
            "displayName",
            "addressComponents",
            "formattedAddress",
            "location",
          ],
        });

        // Parse the place data into our format
        return await usePlaceParser(place);
      } catch (error) {
        // console.error(`Error fetching place details for ID ${placeId}:`, error);
        return null;
      }
    },
    // Cache place details for 1 hour
    staleTime: 60 * 60 * 1000,
  });
}

// -----------------------------------------------------------------------------
// EXPORTS

export default {
  load,
  isReady,
  search,
};
