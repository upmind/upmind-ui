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
    title: raw.address_1 || "New Address",
    description: compact([
      get(raw, "address_2"),
      get(raw, "street"),
      get(raw, "city"),
      get(raw, "postcode"),
      get(raw, "region.name"),
      get(raw, "country.name")
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
      isVerified: !!raw.verified
    }
  };
}

export function mapIAddress(data: AddressModel): IAddress {
  return {
    name: data.name || data.address1 || "Address",
    address_1: data.address1,
    address_2: data.address2,
    city: data.city,
    state: data.state,
    postcode: data.postcode,
    region_id: data.regionId,
    country_id: data.countryId
  } as IAddress;
}
