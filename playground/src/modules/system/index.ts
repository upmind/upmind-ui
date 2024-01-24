// --- external
import { computed } from "vue";
import { useActor } from "@xstate/vue";

// --- internal
import {
  useSystem as useUpmindSystem,
  useSystemPlaces as useUpmindSystemPlaces
} from "@upmind/flow";

// --- utils
import {
  omit,
  sample,
  get,
  isEmpty,
  filter,
  has,
  map,
  compact,
  find
} from "lodash-es";

// --------------------------------------------------------
// a composable that provides a simple interface to the api requests machine
//  with some state helpers

export const useSystem = () => {
  const system = useUpmindSystem();
  const { state, send } = useActor(system.service);

  // --------------------------------------------------------

  const getRandomCountry = (unique?: bool) => {
    const regions = get(state.value.context, "regions", {});
    if (isEmpty(regions)) return; // lets se eif our fallback works

    // otherwise we can just return a random country
    let countries = get(state.value.context, "countries", {});

    if (unique) {
      // lets only return countries that have NOT yet got regions
      countries = filter(countries, country => !has(regions, country.code));
    }

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
          "departments.complete"
        ].some(state.value.matches),
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
    }
  };
};

export const useSystemPlace = item => {
  const { service } = useUpmindSystemPlaces();

  // this will change to be a manager of ALL addresses, for now its a single instance (add/update)
  const { state, send } = item;

  // --------------------------------------------------------

  return {
    state: computed(() => state.value.value),
    context: computed(() => state.value.context),
    errors: computed(() => state.value.context?.error),
    //messages: computed(() => state.value.context?.messages),
    // ---
    meta: computed(() => ({
      isLoading: ["loading"].some(state.value.matches),
      hasErrors: [
        "error",
        "loading.constants.error",
        "loading.autocomplete.error"
      ].some(state.value.matches),
      isSearching: ["searching"].some(state.value.matches),
      isProcessing: ["populating", "checking", "processing"].some(
        state.value.matches
      ),
      isValid: ["valid"].some(state.value.matches),
      isNew: !state.value.context?.model?.id,
      hasAutocomplete: !isEmpty(state.value.context?.autocomplete),
      isComplete:
        state.value.done || ["processed", "complete"].some(state.value.matches)
    })),
    // ---
    title: computed(() => {
      // state.value.context?.model
      return compact([get(state.value.context?.model, "name")]).join(" ");
    }),
    display: computed(() => {
      const country = find(state.value.context?.countries, [
        "id",
        get(state.value.context?.model, "country_id")
      ]);

      const region = find(state.value.context?.regions, [
        "id",
        get(state.value.context?.model, "region_id")
      ]);

      return compact([
        get(state.value.context?.model, "address_1"),
        get(state.value.context?.model, "address_2"),
        get(state.value.context?.model, "street"),
        get(state.value.context?.model, "city"),
        get(state.value.context?.model, "postcode"),
        get(region, "name"),
        get(country, "name")
      ]).join(", ");
    }),
    // ---
    model: computed(() => state.value?.context?.model),
    schema: computed(() => state.value?.context?.schema),
    uischema: computed(() => state.value?.context?.uischema),
    autocomplete: computed(() => state.value?.context?.autocomplete),
    // ---
    input: model => send({ type: "SET", data: model }),
    search: model => send({ type: "SEARCH", data: model }),
    update: () => send({ type: "UPDATE" }),
    clear: () => send({ type: "CLEAR" }),
    select: () => service.send({ type: "SELECT", data: item.id }),
    edit: () => service.send({ type: "EDIT", data: item.id }),
    cancel: () => service.send({ type: "SELECT" })
  };
};

export const useSystemPlaces = () => {
  // this will change to be a manager of ALL addresses, for now its a single instance (add/update)

  const { service } = useUpmindSystemPlaces();
  const { state, send } = useActor(service);

  // --------------------------------------------------------

  return {
    state: computed(() => state.value.value),
    context: computed(() => state.value.context),
    errors: computed(() => state.value.context?.error),
    //messages: computed(() => state.value.context?.messages),
    // ---
    meta: computed(() => ({
      isLoading: ["loading"].some(state.value.matches),
      hasErrors: ["error"].some(state.value.matches),
      isEditing: ["editing"].some(state.value.matches)
    })),
    // ---
    items: computed(() =>
      map(state.value.context.items, item => ({
        id: item.id,
        ...useActor(item)
      }))
    ),
    selected: computed(() =>
      state.value.context?.selected
        ? {
            id: state.value.context.selected?.id,
            ...useActor(state.value.context.selected)
          }
        : null
    ),
    // ---
    select: id => send({ type: "SELECT", data: id }),
    edit: id => send({ type: "EDIT", data: id }),
    add: () => send({ type: "ADD" })
  };
};
