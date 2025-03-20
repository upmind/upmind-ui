// --- external

// -----------------------------------------------------------------------------
// ENUMS

// -----------------------------------------------------------------------------
// private

export interface Places {
  places: google.maps.places.PlacesService;
  service: google.maps.places.AutocompleteService;
  statuses: typeof google.maps.places.PlacesServiceStatus;
  sessionToken: google.maps.places.AutocompleteSessionToken;
  AutocompleteSessionToken: typeof google.maps.places.AutocompleteSessionToken;
}
