// --- extrnal
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// private

import type {
  IAddress,
  // TODO:
  // IAddressType,
  // ICountry,
  // IRegion,
} from "../address/types";

// --------------------------------------------------------
// Contexts

export interface UnifiedAddressContext {
  // TODO:
  // country?: ICountry[];
  // regions?: IRegion[];
  // types?: IAddressType[];
  country?: any[];
  regions?: any[];
  types?: any[];
  baseModel?: IAddress;

  // --- our internal lookup objects
  countries: Object;
  places: Object;
  addresses: Object;
  phones: Object;
  emails: Object;

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

export interface UnifiedAddressesContext {
  items?: IAddress[];
  selected?: IAddress;
  // TODO:
  // error?: RequestError;
  error?: any;
}
// --------------------------------------------------------
// Events

export interface UnifiedAddressEvent {
  type: "ADD" | "UPDATE" | "REMOVE" | "CLEAR" | "SET" | "DEFAULT" | "RETRY";
  data: any;
  // TODO:
  // error?: RequestError;
  error?: any;
}

export interface UnifiedAddressesEvents {
  type: "ADD" | "SELECT" | "REFRESH" | "STOP";
  data: any;
  // TODO:
  // error?: RequestError;
  error?: any;
}
