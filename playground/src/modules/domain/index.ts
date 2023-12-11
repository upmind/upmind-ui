// --- external
import { computed } from "vue";
import { useActor } from "@xstate/vue";

// --- internal
import { useDomain as useUpmindDomain } from "@upmind/flow";

// --- utils
import { map, some, find } from "lodash-es";
// --------------------------------------------------------
// a composable that provides a simple interface to the api requests machine
//  with some state helpers

export const useDomain = (syncBasket?: boolean, forceType?: string) => {
  const domain = useUpmindDomain(syncBasket, forceType);
  const { state, send } = useActor(domain.service);

  // --------------------------------------------------------

  const choose = (value: string) =>
    send({
      type: "CHOOSE",
      data: value
    });

  const search = (value: string) =>
    send({
      type: "SEARCH",
      data: {
        domain: value
      }
    });

  const toggle = (value: string) => {
    const type = some(state.value.context.values, ["domain", value])
      ? "REMOVE"
      : "ADD";

    send({
      type,
      data: value
    });
  };

  const add = (value: string) => {
    send({
      type: "ADD",
      data: value
    });
  };

  const remove = (value: string) => {
    send({
      type: "REMOVE",
      data: value
    });
  };
  // --------------------------------------------------------

  return {
    state: computed(() => state.value.value),
    // ---
    choices: computed(() => state.value.context.choices),
    values: computed(() => state.value.context.values),
    selected: computed(() => map(state.value.context.values, "domain")),
    selectedType: computed(() => state.value.context.type),
    available: computed(() => state.value.context.available),
    errors: computed(() => state.value.context?.error),
    primaryDomain: computed(() =>
      find(state.value.context?.values, "is_primary")
    ),
    //messages: computed(() => state.value.context?.messages),
    // ---
    meta: computed(() => ({
      isProcessing: [
        "active.register.processing",
        "active.transfer.processing",
        "active.existing.processing"
      ].some(state.value.matches),

      hasErrors: [
        "error",
        "active.register.error",
        "active.transfer.error",
        "active.existing.error"
      ].some(state.value.matches),

      // ---
      showChoices: !!state.value.context.choices,
      showRegister: state.value.matches("active.register"),
      showTransfer: state.value.matches("active.transfer"),
      showExisting: state.value.matches("active.existing"),
      showContinue: [
        "active.register.valid",
        "active.transfer.valid",
        "active.existing.valid"
      ].some(state.value.matches),

      // ---
      hasPrimary: some(state.value.context?.values, "is_primary"),
      hasAdditional: state.value.context?.values?.length > 1,
      hasMore:
        !!state.value.context.available.length &&
        state.value.context.available.length < state.value.context.total
    })),
    // ---
    choose,
    search,
    add,
    remove,
    toggle,
    isSelected: (value: string) => [`active.${value}`].some(state.value.matches)
  };
};
