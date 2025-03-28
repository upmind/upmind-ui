// --- internal
import { usePlaces } from "../places";
import { useClientAddress } from "./useClientAddress";

// --- types
import type { PaginatedParams } from "../../query";
import type { ClientItemContext } from "../types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import type { ICountry, IRegion, IAddress } from "@upmind-automation/types";
import { useClientAddresses } from "./useClientAddresses";

// -----------------------------------------------------------------------------

export const AddressTypes = [
  { key: 1, value: "Home" },
  { key: 2, value: "Office" },
  { key: 3, value: "Holiday" },
  { key: 4, value: "Company" },
];

export interface AddressModel {
  address1: IAddress["address_1"];
  address2?: IAddress["address_2"];
  city: IAddress["city"];
  countryId: IAddress["country_id"];
  name?: IAddress["name"];
  postcode: IAddress["postcode"];
  regionId?: IAddress["region_id"];
  state?: IAddress["state"];
  type: IAddress["type"];
}

export interface Address extends AddressModel {
  // --- identifiers
  id: IAddress["id"];
  clientId: IAddress["client_id"];
  // --- computed
  title: string;
  description: string;
  // --- meta info
  meta: {
    canDelete: IAddress["can_delete"];
    isVerified: IAddress["verified"];
    isDefault: IAddress["default"];
  };
}

export interface IAddressWithRelations extends IAddress {
  country: ICountry;
  region: IRegion;
}

export type UseClientAddress = ReturnType<typeof useClientAddress>;

export type UseClientAddresses = ReturnType<typeof useClientAddresses>;

export interface AddressContext extends ClientItemContext {
  types?: typeof AddressTypes;
  model?: AddressModel;
  id?: Address["id"];
  country?: ICountry;
  regions?: IRegion[];
  countries: ICountry[];
  baseModel?: Address;
}
