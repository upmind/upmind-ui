import { computed } from "vue";
import { useActor } from "@xstate/vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal

// --- utils
import { map, get } from "lodash-es";

// ----------------------------------------------------------------------------

export function useLookup(lookup) {
  const { service } = lookup();
  const { state, send } = useActor(service);

  // --------------------------------------------------------

  return {
    state: computed(() => state.value.value),
    context: computed(() => state.value.context),
    errors: computed(() => state.value.context?.error),
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
    add: () => send({ type: "ADD" }),
    refresh: () => {
      debugger;
      send({ type: "REFRESH" });
    }
  };
}

export function useLookupItem({ item }, { emit }) {
  // this will change to be a manager of ALL emails, for now its a single instance (add/update)
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
      hasErrors: ["error"].some(state.value.matches),
      isProcessing: ["checking", "processing"].some(state.value.matches),
      isValid: ["valid"].some(state.value.matches),
      isNew: !state.value.context?.model?.id,
      canRemove: state.value?.context?.model?.can_delete,
      isDefault: !!state.value?.context?.model?.default,
      isVerified: !!state.value?.context?.model?.verified,
      isComplete:
        state.value.done || ["processed", "complete"].some(state.value.matches)
    })),
    // ---
    value: computed(() => item.id),
    title: computed(() => get(state.value.context, "title", item?.title)),
    description: computed(() =>
      get(state.value.context, "description", item?.description)
    ),
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
    select: () => emit("select", item.id),
    edit: () => emit("edit", item.id),
    cancel: () => {
      debugger;
      emit("refresh");
    }
  };
}
