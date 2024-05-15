import { computed } from "vue";
import { useActor } from "@xstate/vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useClientEmails as useUpmindClientEmails } from "@upmind/flow";

// --- utils
import { get, map, debounce, startsWith, find, reject } from "lodash-es";

// --------------------------------------------------------

export const useClientEmail = (item, context?: Object) => {
  const { service } = useUpmindClientEmails();
  // this will change to be a manager of ALL emails, for now its a single instance (add/update)
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
      isSelectable: context?.selectable,
      // ---
      isLoading: ["loading"].some(state.value.matches),
      hasErrors: ["error"].some(state.value.matches),
      isProcessing: ["checking", "processing"].some(state.value.matches),
      isValid: ["valid"].some(state.value.matches),
      isNew: !state.value.context?.model?.id,
      canRemove: state.value?.context?.model?.can_delete,
      isDefault: !!state.value?.context?.model?.default,
      isVerified: !!state.value?.context?.model?.verified,
      isComplete:
        state.value.done || ["processed", "complete"].some(state.value.matches),
    })),
    // ---
    title: computed(() => get(state.value.context, "title")),
    description: computed(() => get(state.value.context, "description")),
    // ---
    model: computed(() => state.value?.context?.model),
    schema: computed(() => state.value?.context?.schema),
    uischema: computed(() => state.value?.context?.uischema),
    // ---
    clear: () => send({ type: "CLEAR" }),
    input: model => send({ type: "SET", data: model }),
    update: () => send({ type: "UPDATE" }),
    remove: () => send({ type: "REMOVE" }),
    setDefault: () => send({ type: "DEFAULT" }),
    // ---
    select: () => service.send({ type: "SELECT", data: item.id }),
    edit: () => service.send({ type: "EDIT", data: item.id }),
    cancel: () => service.send({ type: "REFRESH" }),
  };
};

export const useClientEmails = () => {
  // this will change to be a manager of ALL emails, for now its a single instance (add/update)

  const { service, isReady, getSelected } = useUpmindClientEmails();
  const { state, send } = useActor(service);

  // --------------------------------------------------------
  const items = computed(() =>
    map(state.value.context.items, item => ({
      id: item.id,
      ...useActor(item),
    }))
  );

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
      isEditing:
        ["available.editing"].some(state.value.matches) &&
        !startsWith(state.value.context.selected?.id, "item_"),
      isEmpty:
        state.value.matches("available") &&
        !reject(state.value.context?.items, item =>
          startsWith(item.id, "item_")
        )?.length,
      canFilter:
        state.value.matches("available") &&
        !["available.editing", "available.loading"].some(state.value.matches) &&
        state.value.context?.raw?.length > 1,
    })),
    // ---
    items,
    selected: computed(() =>
      state.value.context?.selected
        ? {
            id: state.value.context.selected?.id,
            ...useActor(state.value.context.selected),
          }
        : null
    ),
    default: computed(() => {
      const item = find(
        items.value,
        item => item.state?.value?.context?.model?.default
      );
      return item;
    }),
    // ---
    isReady,
    getSelected,
    select: async id => {
      if (state.value.matches("available.loading")) {
        await waitFor(
          service,
          newstate => !newstate.matches("available.loading")
        );
      }

      send({ type: "SELECT", data: id });
    },
    filter: debounce(data => send({ type: "FILTER", data }), 300),
    edit: id => send({ type: "EDIT", data: id }),
    add: () => send({ type: "ADD" }),
  };
};
