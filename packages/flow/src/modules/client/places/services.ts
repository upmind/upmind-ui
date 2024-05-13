// --- external
import { Loader } from "@googlemaps/js-api-loader";

// --- internal
import { useSession } from "../../";

// --- utils
import { usePlaceParser, usePredictionsParser } from "./utils";

// --- types
import type { ClientListingsEvents, ClientListingsContext } from "../types.d";

// --------------------------------------------------------
//  ENUMS
// --------------------------------------------------------

const { authSubscription } = useSession();
// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

function load(_context: ClientListingsContext, _event: ClientListingsEvents) {
  const loader = new Loader({
    apiKey: import.meta.env.VITE_APP_GOOGLE_MAPS_API_KEY,
    version: "weekly",
  });

  return loader.importLibrary("places").then(api => {
    return {
      places: new api.PlacesService(document.createElement("div")),
      service: new api.AutocompleteService(),
      AutocompleteSessionToken: api.AutocompleteSessionToken,
      sessionToken: new api.AutocompleteSessionToken(),
      statuses: api.PlacesServiceStatus,
    };
  });
}

async function filterItems(
  { service, sessionToken, statuses }: ClientListingsContext,
  { data }: ClientListingsEvents
) {
  return new Promise((resolve, reject) => {
    if (!service) return reject("Autocomplete service not configured");

    // if we dont have any data, then just return an empty array
    if (!data?.length) resolve([]);

    service.getPlacePredictions(
      {
        input: data,
        sessionToken: sessionToken,
        fields: ["address_components"],
      },
      (result, status) => {
        if (status === statuses.OK) {
          resolve(usePredictionsParser(result));
        } else if (status === statuses.ZERO_RESULTS) {
          resolve([]);
        } else {
          reject(status);
        }
      }
    );
  });
}

async function parse(
  {
    places,
    sessionToken,
    AutocompleteSessionToken,
    statuses,
    service,
  }: ClientListingsContext,
  { data }: ClientListingsEvents
) {
  return new Promise((resolve, reject) => {
    if (!service) reject("Autocomplete service not configured");

    // if we dont have any data, then just return an empty array
    if (!data?.place?.length) reject(null);

    places.getDetails(
      {
        placeId: data?.place,
        sessionToken: sessionToken,
        fields: ["address_components", "name"],
      },
      (result, status) => {
        sessionToken = new AutocompleteSessionToken();

        if (status === statuses.OK) {
          usePlaceParser(result).then(place => {
            resolve(place);
          });
        } else if (status === statuses.ZERO_RESULTS) {
          resolve({});
        } else {
          reject(status);
        }
      }
    );
  });
}

// --------------------------------------------------------
// EXPORTS

export default {
  load,
  parse,
  filter: filterItems,
  authSubscription,
  isAuthenticated: () => Promise.resolve(), // we dont need authentication for this service
};
