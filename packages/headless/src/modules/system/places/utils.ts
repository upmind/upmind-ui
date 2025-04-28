// --- internal
import { Place, useSystem } from "..";

// --- utils
import { compact, find, get, includes, some } from "lodash-es";

// --- types
import type { Places } from "./types";

// -----------------------------------------------------------------------------

function parseCountry(
  addressComponents: google.maps.places.PlaceResult["address_components"]
) {
  const { getCountry } = useSystem();

  const country = find(addressComponents, entry =>
    includes(entry.types, "country")
  );

  return getCountry(get(country, "short_name"));
}

async function parseRegion(
  regionLevel1: string,
  regionLevel2: string,
  country: string
) {
  const { fetchRegions, getRegion } = useSystem();
  await fetchRegions(country);
  return getRegion([regionLevel1, regionLevel2], country);
}

function parseValue(
  addressComponents: google.maps.places.PlaceResult["address_components"],
  fields: string[]
) {
  const value = find(addressComponents, entry =>
    some(entry.types, type => includes(fields, type))
  );

  return get(value, "long_name", "");
}

// -----------------------------------------------------------------------------
export async function usePlaceParser(
  result: google.maps.places.PlaceResult
): Promise<Place> {
  const name = get(result, "name");

  const address = get(result, "address_components", []);

  const address_1 = compact([
    parseValue(address, ["street_number"]),
    parseValue(address, ["route"]),
  ]);

  const address_2 = compact([parseValue(address, ["sublocality"])]);

  const postcode = parseValue(address, ["postal_code"]);

  const city = parseValue(address, [
    "postal_town",
    "locality",
    "administrative_area_level_2",
  ]);

  const country = parseCountry(address);

  const region = await parseRegion(
    parseValue(address, ["administrative_area_level_1"]),
    parseValue(address, ["administrative_area_level_2"]),
    country?.code ?? ""
  );

  const fallbackTitle = compact([address_1, city, get(country, "name")]).join(
    ", "
  );
  const title = name || fallbackTitle || "Address";

  return {
    id: get(result, "place_id", ""),
    title,
    description: get(result, "formatted_address", fallbackTitle),
    address: {
      name,
      address1: address_1.length ? address_1.join(" ") : "",
      address2: address_2.length ? address_2.join(" ") : undefined,
      city,
      type: 1,
      postcode,
      regionId: get(region, "id"),
      countryId: get(country, "id"),
    },
  };
}

export function parsePlaces(api: google.maps.PlacesLibrary): Places {
  return {
    places: new api.PlacesService(document.createElement("div")),
    service: new api.AutocompleteService(),
    statuses: api.PlacesServiceStatus,
    sessionToken: new api.AutocompleteSessionToken(),
    AutocompleteSessionToken: api.AutocompleteSessionToken,
  };
}
