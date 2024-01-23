// --- extrnal
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// private

interface IAddress {
  id: string;
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

// --------------------------------------------------------
// Contexts

export interface PlaceContext {
  country?: ICountry[];
  regions?: IRegion[];
  types?: IPlaceType[];
  baseModel?: IAddress;

  // ---
  autocomplete?: {
    schema?: JsonSchema;
    uischema?: UISchemaElement;
    model?: {
      search?: string;
      place?: string;
    };
    results?: PlaceAutocompleteResult[];
  };
  // ---
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  model?: IAddress;
  // ---
  error?: RequestError;
}

export interface PlacesContext {
  items?: IAddress[];
  selected?: IAddress;
  error?: RequestError;
}
// --------------------------------------------------------
// Events

export interface PlaceEvent {
  type: string;
  data: any;
  error?: RequestError;
}

export interface PlacesEvents {
  type: "ADD" | "SELECT" | "REFRESH" | "STOP";
  data: any;
  error?: RequestError;
}
