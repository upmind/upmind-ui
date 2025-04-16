import services from "./services";

/**
 * Hook to access Google Places API services
 * 
 * This provides access to address searching and parsing functions.
 */
export const usePlaces = () => {
  /**
   * Initialize the places service
   * @returns A promise that resolves when the places service is ready
   */
  async function isReady() {
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

  /**
   * Get detailed address information for a specific Place ID
   * @param placeId Google Place ID to get details for
   * @returns Promise with detailed address information
   */
  function parse(placeId: string) {
    return services.parse(placeId);
  }

  /**
   * Reset the Places service (for testing purposes)
   */
  function reset() {
    return services.reset();
  }

  return {
    isReady,
    search,
    parse,
    reset
  };
};
