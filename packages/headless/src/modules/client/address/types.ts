// --- extrnal
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// private

export interface IAddress {
  id: string;
  // ---
  place?: string | null; // used for place lookup
  // ---
  address_1: string | null;
  address_2: string | null;
  city: string | null;
  postcode: string | null;
  // TODO:
  // country_id: ICountry["id"];
  // country?: ICountry; // Requires relation
  // region_id?: IRegion["id"] | null;
  country_id: any["id"];
  country?: any;
  region_id?: any["id"] | null;
  state: string | null;
  // ---
  type: number | null;
  name: string | null;
  default: boolean;
  // --- readonly/system data
  can_delete: boolean;
  // TODO:
  // client_id: IClient["id"];
  client_id: any["id"];
  created_at: string | null;
  deleted_at: null;
  updated_at: Date | string | null;
  // TODO:
  // user_id: IUser["id"];
  user_id: any["id"];
  verified: number | null;
}

export interface IAddressData {
  address_1: string | null;
  address_2: string | null;
  city: string | null;
  postcode: string | null;
  // TODO:
  // country_id: ICountry["id"];
  // country?: ICountry; // Requires relation
  // region_id?: IRegion["id"] | null;
  country_id: any["id"];
  country?: any; // Requires relation
  region_id?: any["id"] | null;
  state: string | null;
}

// --------------------------------------------------------
// Contexts

export interface AddressContext {
  // TODO:
  // country?: ICountry[];
  // regions?: IRegion[];
  // types?: IAddressType[];
  country?: any[];
  regions?: any[];
  types?: any[];
  baseModel?: IAddress;

  // ---
  autocomplete?: {
    schema?: JsonSchema;
    uischema?: UISchemaElement;
    model?: {
      search?: string;
      address?: string;
    };
    // TODO:
    // results?: AddressAutocompleteResult[];
    results?: any[];
  };
  // ---
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  model?: IAddress;
  // ---
  // TODO:
  // error?: RequestError;
  error?: any;
}

export interface AddressesContext {
  items?: IAddress[];
  selected?: IAddress;
  // TODO:
  // error?: RequestError;
  error?: any;
}
// --------------------------------------------------------
// Events

export interface AddressEvent {
  type: "ADD" | "UPDATE" | "REMOVE" | "CLEAR" | "SET" | "DEFAULT" | "RETRY";
  data: any;
  // TODO:
  // error?: RequestError;
  error?: any;
}

export interface AddressesEvents {
  type: "ADD" | "SELECT" | "REFRESH" | "STOP";
  data: any;
  // TODO:
  // error?: RequestError;
  error?: any;
}
