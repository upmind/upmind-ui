// --- external

// -----------------------------------------------------------------------------
// ENUMS

// -----------------------------------------------------------------------------
// private

import { AddressModel } from "../../client";

export type Place = {
  id: string;
  title: string;
  address: AddressModel;
  description: string;
};

export type Places = {
  places: google.maps.places.PlacesService;
  service: google.maps.places.AutocompleteService;
  statuses: typeof google.maps.places.PlacesServiceStatus;
  sessionToken: google.maps.places.AutocompleteSessionToken;
  AutocompleteSessionToken: typeof google.maps.places.AutocompleteSessionToken;
};
