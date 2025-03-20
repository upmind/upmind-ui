// --- external

// --- internal
import { useSystem } from "../..";

// --- utils
import { some, get, find, includes, map, compact, isArray } from "lodash-es";

// --- types
import { Address } from "../address/types";
import { Places } from "./types";

// -----------------------------------------------------------------------------

function parseCountry(addressComponents: any) {
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

function parseValue(addressComponents: any[], fields: string[]) {
  const value = find(addressComponents, entry =>
    some(entry.types, type => includes(fields, type))
  );

  return get(value, "long_name");
}

// -----------------------------------------------------------------------------
export async function usePredictionsParser(results: any) {
  return map(results, result => {
    const value = {
      id: result.place_id,
      title: result.description,
      description: null,
      // ---
      label: result.description,
      value: result.place_id,
    };

    return value;
  });
}

export async function usePlaceParser(result: any): Promise<Address> {
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

  return {
    name,
    address1: address_1.length ? address_1.join(" ") : undefined,
    address2: address_2.length ? address_2.join(" ") : undefined,
    postcode,
    city,
    countryId: get(country, "id"),
    regionId: get(region, "id"),
  } as Address;
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
