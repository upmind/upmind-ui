import { computed } from "vue";
import { useActor } from "@xstate/vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useClientAddresses as useUpmindClientAddresses } from "@upmind/flow";

// --- utils
import { get, isEmpty, map, compact, find } from "lodash-es";

// --------------------------------------------------------

export const useClientAddress = item => {
  const { service } = useUpmindClientAddresses();

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
      canRemove: state.value?.context?.model?.can_delete,
      isDefault: !!state.value?.context?.model?.default,
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
    clear: () => send({ type: "CLEAR" }),
    input: model => send({ type: "SET", data: model }),
    search: model => send({ type: "SEARCH", data: model }),
    update: () => send({ type: "UPDATE" }),
    remove: () => send({ type: "REMOVE" }),
    setDefault: () => send({ type: "DEFAULT" }),
    // ---
    select: () => service.send({ type: "SELECT", data: item.id }),
    edit: () => service.send({ type: "EDIT", data: item.id }),
    cancel: () => service.send({ type: "REFRESH" })
  };
};

export const useClientAddresses = selected => {
  // this will change to be a manager of ALL addresses, for now its a single instance (add/update)

  const { service } = useUpmindClientAddresses();
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
    select: async id => {
      if (state.value.matches("loading")) {
        await waitFor(service, newstate => !newstate.matches("loading"));
      }

      send({ type: "SELECT", data: id });
    },
    edit: id => send({ type: "EDIT", data: id }),
    add: () => send({ type: "ADD" })
  };
};
