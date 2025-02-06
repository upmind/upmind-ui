import { computed } from "vue";
import { useActor } from "@xstate/vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useClientUnifiedAddresses as useUpmindClientUnifiedAddresses } from "@upmind-automation/headless";

// --- utils
import { machineMatches, useContextActor } from "../../utils";
import { get, debounce, isEmpty } from "lodash-es";

// --------------------------------------------------------

/**
 * @ignore
 */
export const useClientUnifiedAddress = (item: any, context?: any) => {
  const { service } = useUpmindClientUnifiedAddresses();
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
      isSelectable: context?.selectable,
      // ---
      isLoading: ["loading"].some(state.value.matches),
      hasErrors: ["error"].some(state.value.matches),
      isProcessing: ["processing"].some(state.value.matches),
      isValid: ["valid"].some(state.value.matches),
      isNew: !state.value.context?.model?.id,
      canRemove: !!state.value?.context?.model?.canDelete,
      isDefault: !!state.value?.context?.model?.default,
      isVerified: !!state.value?.context?.model?.verified,
      isComplete:
        state.value.done || ["processed", "complete"].some(state.value.matches),
      // ---
      type: state.value?.context?.model?.companyDetails ? "company" : "address",
    })),
    // ---
    filters: computed(() => state.value.context?.filters),
    title: computed(() => get(state.value.context, "title")),
    description: computed(() => get(state.value.context, "description")),
    // ---
    model: computed(() => state.value?.context?.model),
    schema: computed(() => state.value?.context?.schema),
    uischema: computed(() => state.value?.context?.uischema),
    // ---
    clear: () => send({ type: "CLEAR" }),
    input: debounce((model: any) => send({ type: "SET", data: model }), 300),
    update: () => {
      // avoid race conditions and wait for the selected item to be valid
      if (!state.value.matches("valid")) {
        waitFor(service, newState =>
          // @ts-ignore
          newState.context?.selected?.state?.matches("valid")
        ).then(() => {
          send({ type: "UPDATE" });
        });
      } else {
        send({ type: "UPDATE" });
      }
    },
    remove: () => send({ type: "REMOVE" }),
    setDefault: () => send({ type: "DEFAULT" }),
    // ---
    select: () => service.send({ type: "SELECT", data: item.id }),
    edit: () => service.send({ type: "EDIT", data: item.id }),
    cancel: () => service.send({ type: "REFRESH" }),
  };
};

/**
 * @ignore
 */
export const useClientUnifiedAddresses = () => {
  // this will change to be a manager of ALL addresses, for now its a single instance (add/update)

  const { service, isReady, getSelected } = useUpmindClientUnifiedAddresses();
  const { state, send } = useActor(service);

  // --------------------------------------------------------
  const items = useContextActor(state, "items", []);
  const selected = useContextActor(state, "selected");

  // --------------------------------------------------------

  return {
    state: computed(() => state.value.value),
    context: computed(() => state.value.context),
    errors: computed(() => state.value.context?.error),
    //messages: computed(() => state.value.context?.messages),
    // ---
    meta: computed(() => ({
      isAvailable: ["available"].some(state.value.matches),
      isLoading:
        ["subscribing", "checking", "available.loading"].some(
          state.value.matches
        ) || machineMatches(selected, ["loading"]),

      isProcessing: ["available.filtering", "available.processing"].some(
        state.value.matches
      ),
      hasErrors: ["error"].some(state.value.matches),
      isAdding: state.value.matches("available.adding"),
      isEditing: state.value.matches("available.editing"),
      isEmpty:
        state.value.matches("available") && isEmpty(state.value.context?.items),
      canFilter:
        state.value.matches("available") &&
        !["available.editing", "available.adding", "available.loading"].some(
          state.value.matches
        ) &&
        (state.value.context?.raw?.length ?? 0) > 1,
    })),
    // ---
    items,
    selected: computed(() =>
      state.value.context?.selected
        ? {
            // @ts-ignore
            id: state.value.context.selected?.id,
            ...useActor(state.value.context.selected),
          }
        : null
    ),
    // @ts-ignore
    initial: computed(() => state.value.context?.initial),

    // ---
    isReady,
    getSelected,
    filter: debounce(data => send({ type: "FILTER", data }), 300),
    select: async (id: any) => {
      await isReady();
      send({ type: "SELECT", data: id });
    },
    edit: async (id: any) => {
      await isReady();
      send({ type: "EDIT", data: id });
    },
    add: async () => {
      await isReady();
      send({ type: "ADD" });
    },
  };
};
