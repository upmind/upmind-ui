import type { AddressModel } from "../client-address";

// -----------------------------------------------------------------------------

/**
 * Represents a geographical place with basic identification and address details.
 * This structure is used for displaying search results or selected locations.
 */
export type Place = {
  /**
   * A unique identifier for the place.
   */
  id: string;
  /**
   * The display title or name of the place (e.g. "Eiffel Tower", "London Office").
   */
  title: string;
  /**
   * The detailed address components of the place.
   */
  address: AddressModel["address"];
  /**
   * A descriptive string or short summary about the place.
   */
  description: string;
};

/**
 * Type alias for an array of Google Maps Autocomplete suggestions.
 * This is the raw type returned by the Google Places API for autocomplete queries.
 */
export type AutocompleteSuggestions =
  google.maps.places.AutocompleteSuggestion[];

/**
 * Type alias for an array of Google Maps Place Prediction objects.
 * These are the results returned from a Google Places Autocomplete request.
 */
export type PlacePredictions = google.maps.places.PlacePrediction[];

/**
 * Type alias representing a simplified place prediction object, extracted from
 * Google Maps Place Prediction results for easier display in UI components.
 */
export type PlacePrediction = {
  /**
   * A unique identifier for the place prediction, often used as a place ID.
   */
  id: string;
  /**
   * The display label for the place prediction (e.g. "Paris, France").
   */
  label: string;
};

/**
 * Type alias representing the structure of the Google Maps Places service object,
 * providing access to core classes and constructors for Places API functionality.
 * This allows for instantiation of Google Maps Places objects within the application.
 */
export type PlaceService = {
  /**
   * The `Place` class constructor from the Google Maps JavaScript API.
   */
  Place: typeof google.maps.places.Place;
  /**
   * The `AutocompleteSuggestion` class constructor from the Google Maps JavaScript API.
   */
  AutocompleteSuggestion: typeof google.maps.places.AutocompleteSuggestion;
  /**
   * The `AutocompleteSessionToken` class constructor from the Google Maps JavaScript API,
   * used for session-based billing of autocomplete requests.
   */
  AutocompleteSessionToken: typeof google.maps.places.AutocompleteSessionToken;
};
