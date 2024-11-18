// --- extrnal
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --- internal
// import type { RequestError } from "../..//api/types";

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// private

import type { IAddress, IAddressData } from "../address/types";

// --------------------------------------------------------
// Contexts

export interface UnifiedAddressContext {
  country?: any[]; //ICountry[];
  regions?: any[]; //IRegion[];
  types?: any[]; //IAddressType[];
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
  model?: IAddressData;
  // ---
  error?: any;
}

export interface UnifiedAddressesContext {
  items?: IAddress[];
  selected?: IAddress;
  error?: any;
}
// --------------------------------------------------------
// Events

export interface UnifiedAddressEvent {
  type: "ADD" | "UPDATE" | "REMOVE" | "CLEAR" | "SET" | "DEFAULT" | "RETRY";
  data: any;
  error?: any;
}

export interface UnifiedAddressesEvents {
  type: "ADD" | "SELECT" | "REFRESH" | "STOP";
  data: any;
  error?: any;
}
