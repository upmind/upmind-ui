// --- internal

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

export const ADDRESS_TYPE_KEYS = {
  HOME: AddressTypes[0].key,
  OFFICE: AddressTypes[1].key,
  HOLIDAY: AddressTypes[2].key,
  COMPANY: AddressTypes[3].key,
} as const;

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
  // --- context
  title: string;
  description: string;
  // --- meta info
  meta: {
    canDelete: boolean;
    isDefault: boolean;
    isVerified: boolean;
  };
}

export interface AddressContext
  extends ClientItemContext<AddressModel, Address> {
  types?: typeof AddressTypes;
  country?: ICountry;
  regions?: IRegion[];
  countries: ICountry[];
}
