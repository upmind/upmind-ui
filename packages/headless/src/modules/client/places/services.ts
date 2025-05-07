// --- external
import { Loader } from "@googlemaps/js-api-loader";

// --- internal
import { useSession } from "../..";

// --- utils
import { usePlaceParser, usePredictionsParser } from "./utils";

// --- types
import type { AnyEventObject } from "xstate";
import type { ClientListingsContext } from "../types";

// -----------------------------------------------------------------------------
//  ENUMS
// -----------------------------------------------------------------------------

// SERVICE METHODS
// Invoked by machines, providing context and event data

function load(_context: ClientListingsContext, _event: AnyEventObject) {
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
  // TODO: { service, sessionToken, statuses }: ClientListingsContext,
  { service, sessionToken, statuses }: any,
  { data }: AnyEventObject
) {
  return new Promise((resolve, reject) => {
    if (!service)
      return reject(new Error("Autocomplete service not configured"));

    // if we dont have any data, then just return an empty array
    if (!data?.length) resolve([]);

    service.getPlacePredictions(
      {
        input: data,
        sessionToken: sessionToken,
        fields: ["address_components"],
      },
      (result: any, status: any) => {
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
    // TODO: }: ClientListingsContext,
  }: any,
  { data }: AnyEventObject
) {
  return new Promise((resolve, reject) => {
    if (!service) reject(new Error("Autocomplete service not configured"));

    // if we dont have any data, then just return an empty array
    if (!data?.place?.length) reject(null);

    if (data.place == "manual") resolve(null); // special case for entry when a place is to be manually entered

    places.getDetails(
      {
        placeId: data?.place,
        sessionToken: sessionToken,
        fields: ["address_components", "name"],
      },
      (result: any, status: any) => {
        sessionToken = new AutocompleteSessionToken();

        if (status === statuses.OK) {
          usePlaceParser(result).then(place => {
            // remove any empty fields to ensure validation is accurate
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

// -----------------------------------------------------------------------------
// EXPORTS

export default {
  load,
  parse,
  filter: filterItems,
  isAuthenticated: () => Promise.resolve(), // we dont need authentication for this service
};
