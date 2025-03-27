// --- external
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --- internal
// import type { RequestError } from "../..//api/types";

// -----------------------------------------------------------------------------
// ENUMS

// -----------------------------------------------------------------------------
// private
import type {
  ICountry,
  IRegion,
  IAddress,
  IPhone,
  IEmail,
} from "@upmind-automation/types";

import type { AddressTypes } from "../address/types";
import type { ClientItemContext, ClientListingsContext } from "../types";

// -----------------------------------------------------------------------------
// Contexts

export interface UnifiedAddressContext extends ClientItemContext {
  country?: ICountry;
  regions?: IRegion[];
  types?: typeof AddressTypes;
  countries: ICountry[];
  places: any;
  companies: any; // Cpmposable to the address context
  addresses: any; // Cpmposable to the address context
  phones: any; // Composable to the phone context
  emails: any; // Composable to the email context
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
}

export interface UnifiedAddressesContext extends ClientListingsContext {}
