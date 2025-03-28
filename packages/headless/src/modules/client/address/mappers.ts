// --- utils
import { get, map, isArray, compact } from "lodash-es";

// --- types
import type { IAddress } from "@upmind-automation/types";
import type { Address, AddressWithRelations, AddressModel } from "./types";

// ---
export function mapAddress(
  raw: AddressWithRelations | AddressWithRelations[]
): Address[] {
  // we could get a plain address OR a company with and address
  // so we normalize the data to always be an array of addresses
  // this is to allow for a 'unified' way of handling addresses
  const rawListings = isArray(raw) ? raw : [raw];
  return map(rawListings, rawItem => {
    // mappedItem.place = null;
    return {
      id: rawItem.id,
      clientId: rawItem.client_id,
      // ---
      title: rawItem.name || "New Address",
      description: compact([
        get(rawItem, "address1"),
        get(rawItem, "address2"),
        get(rawItem, "street"),
        get(rawItem, "city"),
        get(rawItem, "postcode"),
        get(rawItem, "region.name"),
        get(rawItem, "country.name"),
      ]).join(", "),
      // ---
      name: rawItem.name,
      address1: rawItem.address_1,
      address2: rawItem.address_2,
      city: rawItem.city,
      state: rawItem.state,
      postcode: rawItem.postcode,
      regionId: rawItem.region_id,
      countryId: rawItem.country_id,
      type: rawItem.type,
      // ---
      meta: {
        isDefault: rawItem.default,
        isVerified: rawItem.verified,
        canDelete: rawItem.can_delete,
      },
    };
  });
}

export function mapIAddress(data: AddressModel): IAddress {
  return {
    name: data.name,
    address_1: data.address1,
    address_2: data.address2,
    city: data.city,
    state: data.state,
    postcode: data.postcode,
    region_id: data.regionId,
    country_id: data.countryId,
    type: data.type,
  } as IAddress;
}
