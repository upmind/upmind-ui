// --- external
import { Loader } from "@googlemaps/js-api-loader";
import { compact, isArray, isEmpty, map } from "lodash-es";

// --- internal
import { useQuery } from "../../query";
import { Place, useSystem } from "..";

// --- utils
import { parsePlaces, usePlaceParser } from "./utils";

// --- types
import type { Places } from "./types";

// Private service instance
let placesService: Places | undefined;

/**
 * Initialize the Google Places API and return the service
 */
async function load(): Promise<Places> {
  await useSystem().isReady();

  // If we already have a service, return it
  if (placesService) return placesService;

  // Otherwise create a new service
  const loader = new Loader({
    apiKey: import.meta.env.VITE_APP_GOOGLE_MAPS_API_KEY,
    version: "weekly",
  });

  const service = await loader.importLibrary("places").then(parsePlaces);
  placesService = service;
  return service;
}

/**
 * Search for address suggestions based on user input and return parsed address details
 * @param query Text to search for
 * @returns Promise with array of parsed address details only
 */
async function search(query: string) {
  const { queryClient } = useQuery();

  // Return early if the query is empty
  if (isEmpty(query)) return [];

  // Generate a cache key based on the search query
  const queryKey = ["places", "search", query];

  return queryClient.fetchQuery({
    queryKey,
    queryFn: async () => {
      const places = await load();

      // Get the predictions first
      const predictions = await new Promise<
        google.maps.places.AutocompletePrediction[] | null
      >((resolve, reject) => {
        places.service.getPlacePredictions(
          {
            input: query,
            types: ["address"],
            sessionToken: places.sessionToken,
          },
          (
            predictions: google.maps.places.AutocompletePrediction[] | null,
            status: google.maps.places.PlacesServiceStatus
          ) => {
            if (status === places.statuses.OK) {
              resolve(predictions);
            } else if (status === places.statuses.ZERO_RESULTS) {
              resolve([]);
            } else {
              reject(status);
            }
          }
        );
      });

      // If no predictions or null, return empty array
      if (!isArray(predictions) || isEmpty(predictions)) return [];

      // Parse all predictions and compact the results to remove nulls
      return Promise.all(
        map(predictions, async prediction => {
          try {
            return await parse(prediction.place_id);
          } catch (error) {
            console.error(
              `Failed to parse address ID ${prediction.place_id}:`,
              error
            );
            return null;
          }
        })
      ).then(compact);
    },
    // Cache search results for 5 minutes
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get full details for a place by its ID
 * @param placeId Google Places ID
 * @returns Promise with address details
 */
async function parse(placeId: string): Promise<Place | {} | null> {
  if (isEmpty(placeId)) return Promise.resolve(null);
  if (placeId === "manual") return Promise.resolve(null);

  const { queryClient } = useQuery();

  // Generate a cache key for caching purposes
  const queryKey = ["places", "details", placeId];

  return queryClient.fetchQuery({
    queryKey,
    queryFn: async () => {
      const service = await load();

      return new Promise<Place | {}>((resolve, reject) => {
        service.places.getDetails(
          {
            placeId,
            sessionToken: service.sessionToken,
            fields: ["name", "address_components", "formatted_address"],
          },
          (result, status) => {
            // Get a new session token for the next request
            service.sessionToken = new service.AutocompleteSessionToken();

            if (status === service.statuses.OK && result) {
              usePlaceParser({
                ...result,
                place_id: placeId,
              }).then(place => resolve(place));
            } else if (status === service.statuses.ZERO_RESULTS) {
              resolve({});
            } else {
              reject(status);
            }
          }
        );
      });
    },
    // Cache place details for 1 hour
    staleTime: 60 * 60 * 1000,
  });
}

// -----------------------------------------------------------------------------
// EXPORTS

export default {
  load,
  search,
};
