import { computed } from "vue";
import { useActor } from "@xstate/vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useClientAddresses as useUpmindClientAddresses } from "@upmind/flow";

// --- utils
import { get, map, debounce, startsWith, isEmpty } from "lodash-es";

// --------------------------------------------------------

export const useClientAddress = (item, context?: Object) => {
  const { service } = useUpmindClientAddresses();
  // this will change to be a manager of ALL addresses, for now its a single instance (add/update)
  const { state, send } = item;

  // --------------------------------------------------------

  return {
    state: computed(() => state.value.value),
    context: computed(() => state.value.context),
    errors: computed(() => state.value.context?.error?.message),
    //messages: computed(() => state.value.context?.messages),
    // ---
    meta: computed(() => ({
      isDisabled: context?.disabled,
      isSelected: context?.selected,
      isHidden: context?.hidden,
      // ---
      isLoading: ["loading"].some(state.value.matches),
      hasErrors: [
        "error",
        "loading.constants.error",
        "loading.autocomplete.error",
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
      isVerified: !!state.value?.context?.model?.verified,
      isComplete:
        state.value.done || ["processed", "complete"].some(state.value.matches),
    })),
    // ---
    filters: computed(() => state.value.context?.filters),
    title: computed(() => get(state.value.context, "title")),
    description: computed(() => get(state.value.context, "description")),
    autocomplete: computed(() => state.value?.context?.autocomplete),
    // ---
    model: computed(() => state.value?.context?.model),
    schema: computed(() => state.value?.context?.schema),
    uischema: computed(() => state.value?.context?.uischema),
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
    cancel: () => service.send({ type: "REFRESH" }),
  };
};

export const useClientAddresses = () => {
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
      isAvailable: ["available"].some(state.value.matches),
      isLoading: ["subscribing", "checking", "available.loading"].some(
        state.value.matches
      ),
      isProcessing: ["available.filtering", "available.processing"].some(
        state.value.matches
      ),
      hasErrors: ["error"].some(state.value.matches),
      isAdding:
        ["available.editing"].some(state.value.matches) &&
        startsWith(state.value.context.selected?.id, "item_"),
      isEditing: ["available.editing"].some(state.value.matches),
      isEmpty:
        state.value.matches("available") && !state.value.context?.items?.length,
      canFilter:
        state.value.matches("available") &&
        !["available.editing", "available.loading"].some(state.value.matches) &&
        state.value.context?.raw?.length > 1,
    })),
    // ---
    items: computed(() =>
      map(state.value.context.items, item => ({
        id: item.id,
        ...useActor(item),
      }))
    ),
    selected: computed(() =>
      state.value.context?.selected
        ? {
            id: state.value.context.selected?.id,
            ...useActor(state.value.context.selected),
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
    filter: debounce(data => send({ type: "FILTER", data }), 300),
    edit: id => send({ type: "EDIT", data: id }),
    add: () => send({ type: "ADD" }),
  };
};
