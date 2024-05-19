// --- extrnal
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// private

import type {
  IAddress,
  IAddressType,
  ICountry,
  IRegion,
} from "../address/types";

// --------------------------------------------------------
// Contexts

export interface UnifiedAddressContext {
  country?: ICountry[];
  regions?: IRegion[];
  types?: IAddressType[];
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
    results?: AddressAutocompleteResult[];
  };
  // ---
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  model?: IAddress;
  // ---
  error?: RequestError;
}

export interface UnifiedAddressesContext {
  items?: IAddress[];
  selected?: IAddress;
  error?: RequestError;
}
// --------------------------------------------------------
// Events

export interface UnifiedAddressEvent {
  type: "ADD" | "UPDATE" | "REMOVE" | "CLEAR" | "SET" | "DEFAULT" | "RETRY";
  data: any;
  error?: RequestError;
}

export interface UnifiedAddressesEvents {
  type: "ADD" | "SELECT" | "REFRESH" | "STOP";
  data: any;
  error?: RequestError;
}
