import type { ComputedRef } from "vue";

/**
 * Defines the structure of the metadata object returned from the `useBrand` composable.
 * It contains various flags that represent the current state of the brand process.
 */
export interface IUseBrandMeta {
  /**
   * Indicates whether the brand state machine is currently in a loading state.
   */
  isLoading: boolean;

  /**
   * Indicates whether the brand data is fully ready.
   */
  isReady: boolean;

  /**
   * Indicates whether the brand state machine has completed its operations.
   */
  isComplete: boolean;

  /**
   * Indicates if any errors have occurred during the brand state machine's process.
   */
  hasErrors: boolean;
}

/**
 * Interface for the `useBrand` composable.
 * This interface provides various methods and properties for managing brand data
 * and interacting with the brand state machine in the application.
 */
export interface IUseBrand {
  /**
   * Function to send events to the brand state machine.
   * @param event The event to send.
   */
  send: (event: any) => void;

  /**
   * Computed property to the current state of the brand state machine.
   */
  state: ComputedRef<any>;

  /**
   * Computed property to the brand's state machine context, containing configuration data and settings.
   */
  context: ComputedRef<any>;

  /**
   * Computed property to any errors encountered during the brand state machine's process.
   */
  errors: ComputedRef<any>;

  /**
   * Computed property to the structured responses from the state machine context, excluding errors.
   */
  responses: ComputedRef<any>;

  /**
   * Computed property to metadata flags about brand data.
   */
  meta: ComputedRef<IUseBrandMeta>;

  /**
   * Method that checks if the brand data is fully ready.
   * @returns {boolean} Returns true if the brand data is ready.
   */
  isReady: any;

  /**
   * Get brand configuration.
   * @returns {any} The configuration data for the brand.
   */
  getConfig: any;

  /**
   * Fetch the analytics configuration keys (`ANALYTICS_GA_MEASUREMENT_ID` and `ANALYTICS_GTM_CONTAINER_ID`).
   * @returns {Promise<any>} A promise that resolves to the analytics configuration data.
   */
  getAnayltics: () => Promise<any>;
}
