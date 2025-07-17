// --- types
import type { AddressModel } from "../../client";

// -----------------------------------------------------------------------------

export type Place = {
  id: string;
  title: string;
  address: AddressModel["address"];
  description: string;
};

export type AutocompleteSuggestions =
  google.maps.places.AutocompleteSuggestion[];

export type PlacePredictions = google.maps.places.PlacePrediction[];

export type PlacePrediction = {
  id: string;
  label: string;
};

export type PlaceService = {
  Place: typeof google.maps.places.Place;
  AutocompleteSuggestion: typeof google.maps.places.AutocompleteSuggestion;
  AutocompleteSessionToken: typeof google.maps.places.AutocompleteSessionToken;
};
