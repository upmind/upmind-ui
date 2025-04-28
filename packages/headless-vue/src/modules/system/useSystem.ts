// --- external
import { computed } from "vue";
import { useActor } from "@xstate/vue";

// --- internal
import { useSystem as useUpmindSystem } from "@upmind-automation/headless";
export { useDataLayer, useTracking } from "@upmind-automation/headless";

// --- utils
import { omit, sample, get, isEmpty, filter, has } from "lodash-es";

import type { IUseSystem, IUseSystemMeta } from "./types";

/**
 * The `useSystem` composable provides a simple interface to interact with the system API
 * through a state machine and includes utility methods for fetching data.
 *
 * @returns {Object} The composable returns an object containing the following values:
 * - `send`: Sends events to the system state machine.
 * - `state`: The current state of the system.
 * - `context`: Contains the state machine's context, including fetched data.
 * - `errors`: Any errors present in the system context.
 * - `responses`: The responses from the system, excluding errors.
 * - `meta`: Metadata with various flags about status of system data like `isLoading` and `isReady`.
 */
export const useSystem = (): IUseSystem => {
  const system = useUpmindSystem();
  const { state, send } = useActor(system.service);

  // ---
  const getRandomCountry = (unique?: boolean) => {
    const regions = get(state.value.context, "regions", {});
    if (isEmpty(regions)) return; // lets se eif our fallback works

    // otherwise we can just return a random country
    let countries = get(state.value.context, "countries", {});

    if (unique) {
      // lets only return countries that have NOT yet got regions
      countries = filter(
        countries,
        (country: any) => !has(regions, country.code)
      );
    }

    if (isEmpty(countries)) return;

    const country = sample(countries);
    return country;
  };

  // ---------------------------------------------------------------------------
  return {
    send,
    state: computed(() => state.value.value),
    context: computed(() => state.value.context),
    errors: computed(() => state.value.context?.error),
    responses: computed(() => omit(state.value.context, "error")),
    //messages: computed(() => state.value.context?.messages),
    // ---
    meta: computed(
      (): IUseSystemMeta => ({
        isLoading: [
          "currencies.loading",
          "billingCycles.loading",
          "countries.loading",
          "regions.loading",
          "languages.loading",
          "statuses.loading",
          "departments.loading",
        ].some(state.value.matches),
        isReady:
          ["currencies.complete", "billingCycles.complete"].every(
            state.value.matches
          ) &&
          [
            "countries.idle",
            "regions.idle",
            "languages.idle",
            "statuses.idle",
            "departments.idle",

            "countries.complete",
            "regions.complete",
            "languages.complete",
            "statuses.complete",
            "departments.complete",
          ].some(state.value.matches),
        isComplete: [
          "currencies.complete",
          "billingCycles.complete",
          "countries.complete",
          "regions.complete",
          "languages.complete",
          "statuses.complete",
          "departments.complete",
        ].every(state.value.matches),
        hasErrors: [
          "organisation.error",
          "config.error",
          "settings.error",
          "modules.error",
          "currencies.error",
          "countries.error",
          "regions.error",
          "languages.error",
          "statuses.error",
          "departments.error",
        ].some(state.value.matches),
      })
    ),
    // ---
    fetch: async (key: string, value?: any) => {
      let values;

      switch (key) {
        case "countries":
          values = await system.fetchCountries();
          break;

        case "regions":
          // regions are different as they require a country object
          // and we may need to fetch it from the api,
          if (isEmpty(value)) value = getRandomCountry();
          values = await system.fetchRegions(value);
          break;

        case "languages":
          values = await system.fetchLanguages();
          break;

        case "statuses":
          values = await system.fetchStatuses();
          break;

        case "departments":
          values = await system.fetchDepartments();
          break;
      }

      return values;
    },
  };
};
