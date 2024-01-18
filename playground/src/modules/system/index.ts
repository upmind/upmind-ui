// --- external
import { computed } from "vue";
import { useActor } from "@xstate/vue";

// --- internal
import { useSystem as useUpmindSystem } from "@upmind/flow";

// --- utils
import { omit, sample, keys, get, isEmpty } from "lodash-es";

// --------------------------------------------------------
// a composable that provides a simple interface to the api requests machine
//  with some state helpers

export const useSystem = () => {
  const system = useUpmindSystem();
  const { state, send } = useActor(system.service);

  // --------------------------------------------------------

  const getRandomCountry = () => {
    const countries = get(state.value.context, "countries", {});

    if (isEmpty(countries)) return;

    const country = sample(countries);
    return country;
  };

  // --------------------------------------------------------

  return {
    send,
    state: computed(() => state.value.value),
    context: computed(() => state.value.context),
    errors: computed(() => state.value.context?.error),
    responses: computed(() => omit(state.value.context, "error")),
    //messages: computed(() => state.value.context?.messages),
    // ---
    meta: computed(() => ({
      isLoading: [
        "currencies.loading",
        "billingCycles.loading",
        "countries.loading",
        "regions.loading",
        "languages.loading",
        "statuses.loading",
        "departments.loading"
      ].some(state.value.matches),
      isReady: [
        "currencies.complete",
        "billingCycles.complete",

        "countries.idle",
        "regions.idle",
        "languages.idle",
        "statuses.idle",
        "departments.idle",

        "countries.complete",
        "regions.complete",
        "languages.complete",
        "statuses.complete",
        "departments.complete"
      ].every(state.value.matches),
      isComplete: [
        "currencies.complete",
        "billingCycles.complete",
        "countries.complete",
        "regions.complete",
        "languages.complete",
        "statuses.complete",
        "departments.complete"
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
        "departments.error"
      ].some(state.value.matches)
    })),
    // ---?
    fetch: (key: string, value?: any) => {
      switch (key) {
        case "countries":
          return system.fetchCountries();

        case "regions":
          if (isEmpty(value)) value = getRandomCountry();
          return system.fetchRegions(value);

        case "languages":
          return system.fetchLanguages();

        case "statuses":
          return system.fetchStatuses();

        case "departments":
          return system.fetchDepartments();
      }
    }
  };
};
