// --- external

// --- internal
import { useSystem } from "../..";

// --- utils
import { some, get, find, includes, map } from "lodash-es";

// --- types
import type { IAddress } from "../address/types.d";
import type { ICountry } from "../../system/types.d";

// --------------------------------------------------------

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
  country: ICountry
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

// --------------------------------------------------------
export async function usePredictionsParser(results: any) {
  return map(results, result => {
    const value = {
      id: result.place_id,
      title: result.description,
      description: null
    };

    return value;
  });
}

export async function usePlaceParser(result: any): Promise<IAddress> {
  const name = get(result, "name");
  const address = get(result, "address_components", []);

  const address_1 = [
    parseValue(address, ["street_number"]),
    parseValue(address, ["route"])
  ];

  const address_2 = [parseValue(address, ["sublocality"])];

  const postcode = parseValue(address, ["postal_code"]);

  const city = parseValue(address, [
    "postal_town",
    "locality",
    "administrative_area_level_2"
  ]);

  const country = parseCountry(address);

  const region = await parseRegion(
    parseValue(address, ["administrative_area_level_1"]),
    parseValue(address, ["administrative_area_level_2"]),
    country
  );

  const value = {
    name,
    address_1: address_1.join(" "),
    address_2: address_2.join(" "),
    postcode,
    city,
    country_id: get(country, "id"),
    region_id: get(region, "id")
  };

  return value as IAddress;
}
