// --- utils
import { get, map, isArray, compact } from "lodash-es";

// --- types
import type { IAddress } from "@upmind-automation/types";
import type { Address, AddressModel } from "./types";

// ---
export function mapAddresses(raw: IAddress | IAddress[]): Address[] {
  // we could get a plain address OR a company with and address
  // so we normalize the data to always be an array of addresses
  // this is to allow for a 'unified' way of handling addresses
  const rawListings = isArray(raw) ? raw : [raw];
  return map(rawListings, mapAddress);
}

export function mapAddress(raw: IAddress): Address {
  return {
    id: raw.id,
    clientId: raw.client_id,
    // ---
    title: raw.name || raw.address_1 || "New Address",
    description: compact([
      get(raw, "address1"),
      get(raw, "address2"),
      get(raw, "street"),
      get(raw, "city"),
      get(raw, "postcode"),
      get(raw, "region.name"),
      get(raw, "country.name"),
    ]).join(", "),
    // ---
    name: raw.name,
    address1: raw.address_1,
    address2: raw.address_2,
    city: raw.city,
    state: raw.state,
    postcode: raw.postcode,
    regionId: raw.region_id,
    countryId: raw.country_id,
    type: raw.type,
    // ---
    meta: {
      isDefault: raw.default,
      canDelete: raw.can_delete,
      isVerified: !!raw.verified,
    },
  };
}

export function mapIAddress(data: any): IAddress {
  // TODO: useModelParser expects the data to match the schema(why it is nested in an address object)
  // We need to flatten the data
  return {
    name: data.address.name,
    address_1: data.address.address1,
    address_2: data.address.address2,
    city: data.address.city,
    state: data.address.state,
    postcode: data.address.postcode,
    region_id: data.address.regionId,
    country_id: data.address.countryId,
    type: data.address.type,
  } as IAddress;
}
