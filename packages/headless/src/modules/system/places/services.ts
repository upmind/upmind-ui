// --- external
import { Loader } from "@googlemaps/js-api-loader";

// --- utils
import { parsePlaces, usePlaceParser, usePredictionsParser } from "./utils";

// --- types
import { Places } from "./types";

// Private service instance
let placesService: Places | undefined;

/**
 * Initialize the Google Places API and return the service
 */
async function load(): Promise<Places> {
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
 * Search for address suggestions based on user input
 * @param query Text to search for
 * @returns Promise with array of address suggestions
 */
function search(query: string) {
  return load().then(places => {
    if (!query?.length) return [];
    
    return new Promise<any[]>((resolve, reject) => {
      places.service.getPlacePredictions(
        {
          input: query,
          types: ["address"],
          sessionToken: places.sessionToken,
        },
        (predictions: google.maps.places.AutocompletePrediction[] | null, status: google.maps.places.PlacesServiceStatus) => {
          if (status === places.statuses.OK) {
            usePredictionsParser(predictions || []).then(resolve);
          } else if (status === places.statuses.ZERO_RESULTS) {
            resolve([]);
          } else {
            reject(status);
          }
        }
      );
    });
  });
}

/**
 * Get full details for a place by its ID
 * @param placeId Google Places ID
 * @returns Promise with address details
 */
function parse(placeId: string) {
  if (!placeId?.length) return Promise.resolve(null);
  if (placeId === "manual") return Promise.resolve(null);
  
  return load().then(places => {
    return new Promise((resolve, reject) => {
      places.places.getDetails(
        {
          placeId,
          sessionToken: places.sessionToken,
          fields: ["address_components", "name", "formatted_address", "geometry"],
        },
        (result: google.maps.places.PlaceResult | null, status: google.maps.places.PlacesServiceStatus) => {
          // Get a new session token for the next request
          places.sessionToken = new places.AutocompleteSessionToken();
          
          if (status === places.statuses.OK && result) {
            usePlaceParser(result).then(place => {
              resolve(place);
            });
          } else if (status === places.statuses.ZERO_RESULTS) {
            resolve({});
          } else {
            reject(status);
          }
        }
      );
    });
  });
}

/**
 * Reset the Places service (for testing purposes)
 */
function reset() {
  placesService = undefined;
}

// -----------------------------------------------------------------------------
// EXPORTS

export default {
  load,
  search,
  parse,
  reset,
};
