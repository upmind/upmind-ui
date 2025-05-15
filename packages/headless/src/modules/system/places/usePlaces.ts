import services from "./services";

/**
 * Hook to access Google Places API services
 *
 * This provides access to address searching and parsing functions.
 */
export const usePlaces = () => {
  /**
   * Initialize the Google Places API and return the service
   */
  function load() {
    return services.load();
  }

  /**
   * Search for address suggestions based on user input
   * @param query Text to search for
   * @returns Promise with array of address suggestions
   */
  function search(query: string) {
    return services.search(query);
  }

  return {
    load,
    search,
  };
};
