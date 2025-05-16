// --- internal
import { useClientAddress } from "./useClientAddress";
import { useClientAddresses } from "./useClientAddresses";

// --- types
import type { ClientItemContext } from "../types";
import type {
  ICountry,
  IRegion,
  IAddress,
  BrandConfigKeys,
} from "@upmind-automation/types";

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
    canDelete: boolean;
    isDefault: boolean;
    isVerified: boolean;
  };
}

export type UseClientAddress = ReturnType<typeof useClientAddress>;

export type UseClientAddresses = ReturnType<typeof useClientAddresses>;

export interface AddressContext extends ClientItemContext {
  types?: typeof AddressTypes;
  model?: AddressModel;
  id?: Address["id"];
  country?: ICountry;
  regions?: IRegion[];
  config?: Record<BrandConfigKeys, boolean>;
  countries: ICountry[];
  baseModel?: Address;
}
