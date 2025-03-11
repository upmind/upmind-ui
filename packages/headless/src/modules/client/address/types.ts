// --- external
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --- internal
// import type { RequestError } from "../..//api/types";
import type { ICountry, IRegion, IAddress } from "@upmind-automation/types";
import type { ClientItemContext, ClientListingsContext } from "../types";
// -----------------------------------------------------------------------------

export const AddressTypes = [
  { key: 1, value: "Home" },
  { key: 2, value: "Office" },
  { key: 3, value: "Holiday" },
  { key: 4, value: "Company" },
];

export interface IAddressData {
  id?: string;
  name?: string | null;
  address1?: string;
  address2?: string;
  city?: string | null;
  postcode?: string | null;
  countryId?: ICountry["id"];
  country?: ICountry; // Requires relation
  regionId?: IRegion["id"];
  state?: string | null;
}

export interface AddressContext extends ClientItemContext {
  country?: ICountry;
  regions?: IRegion[];
  addresses: any; // Cpmposable to the address context
  types?: typeof AddressTypes;
  baseModel?: IAddress;

  autocomplete?: {
    schema?: JsonSchema;
    uischema?: UISchemaElement;
    model?: {
      search?: string;
      address?: string;
    };
    results?: any[]; //AddressAutocompleteResult[];
  };
  model?: IAddressData;
}

export interface AddressesContext extends ClientListingsContext {}
