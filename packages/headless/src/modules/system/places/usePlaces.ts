import services from "./services";
import { PlaceService } from "./types";

/**
 * Hook to access Google Places API services
 * This provides access to address searching and parsing functions.
 */

// Private service instance

export const usePlaces = () => {
  return {
    /**
     * Initialize the Google Places API and return the service
     * this needs to wait to be mounted
     */
    load: services.load,
    /**
     * Search for address suggestions based on user input
     * @param query Text to search for
     * @param countryCode Optional country id to restrict results
     * @returns Promise with array of address suggestions
     */
    search: services.search,
    /**
     * Parse a place object into a more usable format
     * @param place Place object to parse
     * @returns Parsed place object with formatted address and coordinates
     *
     */
    isReady: services.isReady,
  };
};
