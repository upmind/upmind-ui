import type { ComputedRef } from "vue";

/**
 * Defines the structure of the metadata object returned from the `useSystem` composable.
 * It contains various flags that represent the current state of the system process.
 */
export interface IUseSystemMeta {
  /**
   * Indicates whether the system state machine is currently in a loading state.
   */
  isLoading: boolean;

  /**
   * Indicates whether the system data is fully ready.
   */
  isReady: boolean;

  /**
   * Indicates whether the system state machine has completed its operations.
   */
  isComplete: boolean;

  /**
   * Indicates if any errors have occurred during the system state machine's process.
   */
  hasErrors: boolean;
}

/**
 * Interface for the `useSystem` composable.
 * This interface provides various methods and properties for managing system data
 * and interacting with the system state machine in the application.
 */
export interface IUseSystem {
  /**
   * Function to send events to the system state machine.
   * @param event The event to send.
   */
  send: (event: any) => void;

  /**
   * Computed property to the current state of the system state machine.
   */
  state: ComputedRef<any>;

  /**
   * Computed property to the system's state machine context, containing fetched data.
   */
  context: ComputedRef<any>;

  /**
   * Computed property to any errors encountered during the system state machine's process.
   */
  errors: ComputedRef<any>;

  /**
   * Computed property to the structured responses from the state machine context, excluding errors.
   */
  responses: ComputedRef<any>;

  /**
   * Computed property to metadata flags about the system data such as `isLoading` and `isReady`.
   */
  meta: ComputedRef<IUseSystemMeta>;

  /**
   * Get specific system-related data from Upmind's API.
   * @param key The key representing the type of data to fetch (e.g., countries, regions, languages).
   * @param value Optional additional data for the fetch operation.
   * @returns {Promise<any>} A promise that resolves to the fetched data.
   */
  fetch: (key: string, value?: any) => Promise<any>;
}
