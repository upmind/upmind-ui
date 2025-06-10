// --- types
import type { AddressModel } from "../../client";

// -----------------------------------------------------------------------------

export type Place = {
  id: string;
  title: string;
  address: AddressModel;
  description: string;
};

export type PlaceService = {
  Place: typeof google.maps.places.Place;
  AutocompleteSuggestion: typeof google.maps.places.AutocompleteSuggestion;
  AutocompleteSessionToken: typeof google.maps.places.AutocompleteSessionToken;
};
