import { computed } from "vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import {
  useQuery as useUpmindQuery,
  useClientAddress as useUpmindClientAddress,
  useClientAddresses as useUpmindClientAddresses,
} from "@upmind-automation/headless";

// --- utils
import { get, debounce } from "lodash-es";

// -----------------------------------------------------------------------------
export const useClientAddress = (
  item: any, // Actor
  context?: Record<string, any>
) => {
  const { service } = useUpmindClientAddress();
  // this will change to be a manager of ALL addresses, for now its a single instance (add/update)
  const { state, send } = item;
  // ---------------------------------------------------------------------------
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
  } as ClientItemDefinition;
};
