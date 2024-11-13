// --- extrnal
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --- internal
import type { RequestError } from "../..//api/types";

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// private

interface IAddress {
  id: string;
  // ---
  place?: string | null; // used for place lookup
  // ---
  address_1: string | null;
  address_2: string | null;
  city: string | null;
  postcode: string | null;
  country_id: ICountry["id"];
  country?: ICountry; // Requires relation
  region_id?: IRegion["id"] | null;
  state: string | null;
  // ---
  type: number | null;
  name: string | null;
  default: boolean;
  // --- readonly/system data
  can_delete: boolean;
  client_id: IClient["id"];
  created_at: string | null;
  deleted_at: null;
  updated_at: Date | string | null;
  user_id: IUser["id"];
  verified: number | null;
}

interface IAddressData {
  address1: string | null;
  address2: string | null;
  city: string | null;
  postcode: string | null;
  countryId: ICountry["id"];
  country?: ICountry; // Requires relation
  regionId?: IRegion["id"] | null;
  state: string | null;
}

// --------------------------------------------------------
// Contexts

export interface AddressContext {
  country?: ICountry[];
  regions?: IRegion[];
  types?: IAddressType[];
  baseModel?: IAddressData;

  // ---
  autocomplete?: {
    schema?: JsonSchema;
    uischema?: UISchemaElement;
    model?: {
      search?: string;
      address?: string;
    };
    results?: AddressAutocompleteResult[];
  };
  // ---
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  model?: IAddressData;
  // ---
  error?: RequestError;
}

export interface AddressesContext {
  items?: IAddress[];
  selected?: IAddress;
  error?: RequestError;
}
// --------------------------------------------------------
// Events

export interface AddressEvent {
  type: "ADD" | "UPDATE" | "REMOVE" | "CLEAR" | "SET" | "DEFAULT" | "RETRY";
  data: any;
  error?: RequestError;
}

export interface AddressesEvents {
  type: "ADD" | "SELECT" | "REFRESH" | "STOP";
  data: any;
  error?: RequestError;
}
