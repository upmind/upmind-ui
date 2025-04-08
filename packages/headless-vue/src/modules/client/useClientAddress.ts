import { useActor } from "@xstate/vue";
import { computed, onUnmounted } from "vue";

// --- internal
import {
  type Address,
  AddressModel,
  useClientAddress as useUpmindClientAddress,
} from "@upmind-automation/headless";

// --- utils
import { get, debounce } from "lodash-es";

// --- types
export type { Address, AddressModel } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------
export const useClientAddress = (
  id?: Address["id"],
  options: { allowMultipleEdits?: boolean } = {}
) => {
  const { service, update, input, clear, isReady, stop } =
    useUpmindClientAddress(id, options);
  // this will change to be a manager of ALL addresses, for now its a single instance (add/update)
  const { state } = useActor(service);

  // -- housekeeping
  onUnmounted(() => {
    stop();
  });
  // ---------------------------------------------------------------------------
  return {
    isReady,
    state: computed(() => state.value.value),
    context: computed(() => state.value.context),
    errors: computed(() => state.value.context?.error?.message),
    // ---
    meta: computed(() => ({
      isLoading: ["loading"].some(state.value.matches),
      hasErrors: ["available.error"].some(state.value.matches),
      isProcessing: ["processing"].some(state.value.matches),
      isValid: ["available.valid"].some(state.value.matches),
      isNew: !state.value.context?.model?.id,
      canRemove: !!state.value?.context?.model?.canDelete,
      isDefault: !!state.value?.context?.model?.default,
      isVerified: !!state.value?.context?.model?.verified,
      isComplete: state.value.done || ["complete"].some(state.value.matches),
    })),
    // ---
    // filters: computed(() => state.value.context?.filters),
    title: computed(() => get(state.value.context, "title")),
    description: computed(() => get(state.value.context, "description")),
    // ---
    model: computed(() => state.value?.context?.model),
    schema: computed(() => state.value?.context?.schema),
    uischema: computed(() => state.value?.context?.uischema),
    // ---
    clear,
    input: debounce((model: AddressModel) => input(model), 300),
    update,
    stop,
  };
};
