// --- extrnal
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --- internal
// import type { RequestError } from "../..//api/types";

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// private

export interface IAddress {
  id?: string;
  // ---
  place?: string; // used for place lookup
  // ---
  address_1?: string;
  address_2?: string;
  city?: string;
  postcode?: string;
  country_id?: string; //ICountry["id"];
  country?: any; //ICountry; // Requires relation
  region?: any; //IRegion; // Requires relation
  region_id?: string; //IRegion["id"] ;
  state?: string;
  // ---
  type?: number;
  name?: string;
  default?: boolean;
  // --- readonly/system data
  can_delete?: boolean;
  client_id?: string; // IClient["id"];
  created_at?: string;
  deleted_at?: null;
  updated_at?: Date | string;
  user_id?: string; // IUser["id"];
  verified?: number;
}

export interface IAddressData {
  id?: string;
  name?: string;
  address1?: string;
  address2?: string;
  city?: string;
  postcode?: string;
  countryId?: string; //ICountry["id"];
  country?: object; //ICountry; // Requires relation
  regionId?: string; //IRegion["id"] ;
  state?: string;
}

// --------------------------------------------------------
// Contexts

export interface AddressContext {
  country?: any[]; //ICountry[];
  regions?: any[]; //IRegion[];
  types?: any[]; //IAddressType[];
  baseModel?: IAddressData;

  // ---
  autocomplete?: {
    schema?: JsonSchema;
    uischema?: UISchemaElement;
    model?: {
      search?: string;
      address?: string;
    };
    results?: any[]; //AddressAutocompleteResult[];
  };
  // ---
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  model?: IAddressData;
  // ---
  error?: any;
}

export interface AddressesContext {
  items?: IAddress[];
  selected?: IAddress;
  error?: any;
}
// --------------------------------------------------------
// Events

export interface AddressEvent {
  type?: "ADD" | "UPDATE" | "REMOVE" | "CLEAR" | "SET" | "DEFAULT" | "RETRY";
  data?: any;
  error?: any;
}

export interface AddressesEvents {
  type?: "ADD" | "SELECT" | "REFRESH" | "STOP";
  data?: any;
  error?: any;
}
