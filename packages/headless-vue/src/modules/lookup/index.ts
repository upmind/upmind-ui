// ---
import { computed } from "vue";
import { useActor } from "@xstate/vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal

// --- utils
import { map, get, pick, debounce } from "lodash-es";
import { DEBOUNCE_DELAY } from "../../utils";

// ----------------------------------------------------------------------------

const maybeActor = (item: any) =>
  item?.state ? { id: item.id, ...item.state.context } : item;
// ---
export function useLookup(lookup: Function) {
  const { service } = lookup();
  const { state, send }: any = useActor(service);

  // ---------------------------------------------------------------------------
  return {
    state: computed(() => state.value.value),
    context: computed(() => state.value.context),
    errors: computed(() => state.value.context?.error),
    // ---
    meta: computed(() => ({
      isLoading: ["loading"].some(state.value.matches),
      isProcessing: ["filtering", "processing"].some(state.value.matches),
      isFiltered: ["filtered"].some(state.value.matches),
      hasErrors: ["error"].some(state.value.matches),
      isEditing: ["editing"].some(state.value.matches),
    })),
    // ---
    items: computed(() =>
      map(state.value.context.items, item =>
        pick(maybeActor(item), ["id", "title", "description"])
      )
    ),
    selected: computed(() => state.value.context?.selected?.id),
    selectedActor: computed(() => {
      if (state.value.context?.selected) {
        return {
          id: state.value.context?.selected.id,
          ...useActor(state.value.context?.selected),
        };
      }
      return null;
    }),
    filters: computed(() => state.value.context?.filters),
    value: computed(() => {
      const selected = maybeActor(state.value.context?.selected);
      return get(selected, "id", null);
    }),
    title: computed(() => {
      const selected = maybeActor(state.value.context?.selected);
      return get(selected, "title", null);
    }),
    description: computed(() => {
      const selected = maybeActor(state.value.context?.selected);
      return get(selected, "description", null);
    }),

    // ---
    select: async (id: any) => {
      if (state.value.matches("loading")) {
        await waitFor(service, newstate => !newstate.matches("loading"));
      }
      send({ type: "SELECT", data: id });
    },

    edit: (id: any) => send({ type: "EDIT", data: id }),
    add: () => send({ type: "ADD" }),
    refresh: () => send({ type: "REFRESH" }),

    filter: debounce(data => send({ type: "FILTER", data }), DEBOUNCE_DELAY),
    // filter: data => send({ type: "FILTER", data })
  };
}

export function useLookupItem({ item }: any, { emit }: any) {
  // this will change to be a manager of ALL emails, for now its a single instance (add/update)

  const { state, send } = item;

  // ---------------------------------------------------------------------------
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
      canRemove: state.value?.context?.model?.canDelete,
      canAdd: !!state.value?.context,
      isDefault: !!state.value?.context?.model?.default,
      isVerified: !!state.value?.context?.model?.verified,
      isComplete:
        state.value.done || ["processed", "complete"].some(state.value.matches),
    })),

    // ---
    model: computed(() => state.value?.context?.model),
    schema: computed(() => state.value?.context?.schema),
    uischema: computed(() => state.value?.context?.uischema),
    // ---
    clear: () => send({ type: "CLEAR" }),
    input: (model: any) => send({ type: "SET", data: model }),
    update: () => send({ type: "UPDATE" }),
    remove: () => send({ type: "REMOVE" }),
    setDefault: () => send({ type: "DEFAULT" }),
    // ---
    select: () => emit("select", item.id),
    edit: () => emit("edit", item.id),
    cancel: () => emit("refresh"),
  };
}
