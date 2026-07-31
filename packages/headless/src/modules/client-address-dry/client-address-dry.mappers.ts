/** @internal */
import { map, get, compact, isArray } from "lodash-es";
import type { Address, AddressModel } from "./client-address-dry.types";
import type { IAddress } from "@upmind-automation/types";

// -----------------------------------------------------------------------------
/**
 * @module client-address-dry/mappers
 * @description Wire <-> view-model shaping only, shared by all three cells —
 * no per-actor mapper split (`templates/ARMS.md` "Which files can earn an
 * arm"; the per-actor divergence for this module is the endpoint the
 * services arm calls, not the shape of what it maps).
 */

export function mapAddresses(raw: IAddress | IAddress[]): Address[] {
  const rawListings = isArray(raw) ? raw : [raw];
  return map(rawListings, mapAddress);
}

export function mapAddress(raw: IAddress): Address {
  return {
    id: raw.id,
    clientId: raw.client_id,
    title: raw.address_1 || "New Address",
    countryName: get(raw, "country.name"),
    description: compact([
      get(raw, "address_2"),
      get(raw, "city"),
      get(raw, "postcode"),
      get(raw, "region.name"),
      get(raw, "country.name")
    ]).join(", "),
    regionName: get(raw, "region.name"),
    name: raw.name,
    address: {
      address1: raw.address_1,
      address2: raw.address_2,
      city: raw.city,
      state: raw.state,
      postcode: raw.postcode,
      regionId: raw.region_id,
      countryId: raw.country_id
    },
    type: raw.type,
    meta: {
      isDefault: raw.default,
      canDelete: raw.can_delete,
      isVerified: !!raw.verified
    }
  };
}

/** D-ADDR-3 — `type` is carried in the write body (un-force of baseline `client-address.mappers.ts:62`'s `type: 1`). */
export function mapIAddressData(data: AddressModel | Address): IAddress {
  return {
    name: data.name || data.address.address1 || "",
    address_1: data.address.address1 ?? "",
    address_2: data.address.address2 ?? "",
    city: data.address.city ?? "",
    state: data.address.state ?? "",
    postcode: data.address.postcode ?? "",
    region_id: data.address.regionId,
    country_id: data.address.countryId,
    type: data.type
  } as IAddress;
}
