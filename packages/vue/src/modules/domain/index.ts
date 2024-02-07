// --------------------------------------------------------

// --- external
import { computed } from "vue";
import { useActor } from "@xstate/vue";

// --- internal
import { useDomain as useUpmindDomain } from "@upmind/flow";

// --- utils
import { map, some, find } from "lodash-es";

// --- types

// --------------------------------------------------------
// a composable that provides a simple interface to the api requests machine
//  with some state helpers

export const useDomain = (
  syncBasket?: boolean,
  forceType?: string,
  parent: Object // machine representing the parent context
) => {
  const domain = useUpmindDomain(syncBasket, forceType, parent);
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

  const setPrimaryDomain = (value: string) => {
    send({
      type: "SELECT",
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
      isLoading: state.value.matches("loading"),

      isProcessing: [
        "register.processing",
        "transfer.processing",
        "existing.processing"
      ].some(state.value.matches),

      isSyncing: [
        "register.syncing",
        "transfer.syncing",
        "existing.syncing",
        "basket.syncing"
      ].some(state.value.matches),

      isSearching: [
        "register.processing.searching",
        "transfer.processing.searching",
        "existing.processing.idle"
      ].some(state.value.matches),

      hasErrors: [
        "error",
        "register.error",
        "transfer.error",
        "existing.error"
      ].some(state.value.matches),

      // ---
      showChoices:
        !state.value.matches("loading") && !!state.value.context.choices,
      showRegister: state.value.matches("register"),
      showTransfer: state.value.matches("transfer"),
      showExisting: state.value.matches("existing"),
      showBasket: state.value.matches("basket"),
      showContinue:
        [
          "register.valid",
          "transfer.valid",
          "existing.valid",
          "basket.valid"
        ].some(state.value.matches) &&
        some(state.value.context?.values, "is_primary"),
      // ---
      hasValues: !!state.value.context?.values?.length,
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
    setPrimaryDomain,
    isSelected: (value: string) => state.value.matches(value),
    destroy: domain.destroy
  };
};
