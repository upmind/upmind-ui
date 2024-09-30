import { computed } from "vue";
import { useActor } from "@xstate/vue";
import { useApi as useUpmindApi } from "@upmind/headless";
import { keys } from "lodash-es";

/**
 * A composable function that provides an interface to the API request machine with state helpers.
 * This function connects to the Upmind API and provides useful methods and computed properties
 * for interacting with the API's state and context.
 *
 * @returns {Object} - The API interface, state management helpers, and utility functions.
 * @property {Function} send - Sends an event to the API machine.
 * @property {ComputedRef} state - The current state of the API machine.
 * @property {ComputedRef} context - The context of the API machine containing data and metadata.
 * @property {ComputedRef} errors - Any errors present in the API's context.
 * @property {ComputedRef} meta - Metadata for the API, including idle, active, and error states.
 * @property {ComputedRef} requests - The current requests being processed by the API.
 * @property {ComputedRef} count - The number of active API requests.
 * @property {Function} useUrl - Utility function to handle API URLs.
 * @property {Function} useTime - Utility function for time-related API calls.
 * @property {Function} get - Sends a GET request to the API.
 * @property {Function} post - Sends a POST request to the API.
 */
export const useApi = (): object => {
  const api = useUpmindApi();
  const { state, send }: any = useActor(api.service);

  return {
    send,
    state: computed(() => state.value.value),
    context: computed(() => state.value.context),
    errors: computed(() => state.value.context?.error),
    //messages: computed(() => state.value.context?.messages),
    meta: computed(() => ({
      isIdle: ["loading"].some(state.value.matches),
      isActive: ["processing"].some(state.value.matches),
      hasErrors: ["error"].some(state.value.matches),
    })),
    requests: computed(() => state.value.context.requests),
    count: computed(() => keys(state.value.context.requests)?.length || 0),
    useUrl: api.useUrl,
    useTime: api.useTime,
    get: api.get,
    post: api.post,
  };
};
