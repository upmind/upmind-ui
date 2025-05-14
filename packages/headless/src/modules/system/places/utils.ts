// --- internal
import { useSystem } from "..";

// --- utils
import { compact, find, get, includes, some } from "lodash-es";

// --- types
import type { Place, PlaceService } from "./types";

// -----------------------------------------------------------------------------

function parseCountry(
  addressComponents: google.maps.places.AddressComponent[]
) {
  const { getCountry } = useSystem();

  const country = find(addressComponents, entry =>
    includes(entry.types, "country")
  );

  return getCountry(country?.shortText || "");
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
  addressComponents: google.maps.places.AddressComponent[],
  fields: string[]
) {
  const value = find(addressComponents, entry =>
    some(entry.types, type => includes(fields, type))
  );

  return value?.longText || "";
}

// -----------------------------------------------------------------------------
export async function usePlaceParser(
  place: google.maps.places.Place
): Promise<Place> {
  // Extract data from place object
  const name = place.displayName;
  const address = place.addressComponents || [];

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

  const fallbackTitle = compact([
    address_1.join(" "),
    city,
    get(country, "name"),
  ]).join(", ");
  const title = name || fallbackTitle || "Address";

  return {
    id: place.id,
    title,
    description: place.formattedAddress || fallbackTitle,
    address: {
      name,
      city,
      type: 1,
      postcode,
      address1: address_1.length ? address_1.join(" ") : "",
      address2: address_2.length ? address_2.join(" ") : undefined,
      regionId: get(region, "id"),
      countryId: get(country, "id"),
    },
  };
}

export function parsePlaces(api: google.maps.PlacesLibrary): PlaceService {
  return {
    Place: api.Place,
    AutocompleteSuggestion: api.AutocompleteSuggestion,
    AutocompleteSessionToken: api.AutocompleteSessionToken,
  };
}
