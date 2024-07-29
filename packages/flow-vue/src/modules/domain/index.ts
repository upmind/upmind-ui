// --------------------------------------------------------

// --- external
import { computed } from "vue";
import { useActor } from "@xstate/vue";

// --- internal
import { useDomain as useUpmindDomain } from "@upmind/flow";

// --- utils
import { map, some, find, isArray, isEmpty } from "lodash-es";

// --- types

// --------------------------------------------------------
// a composable that provides a simple interface to the api requests machine
//  with some state helpers

export const useDomain = (
  {
    sync,
    type,
    parentId,
  }: {
    sync?: boolean;
    type?: "register" | "transfer" | "existing" | "basket";
    parentId?: string; // id of basket item machine representing the parent context
  } = {
    sync: false,
    type: undefined,
    parentId: undefined,
  }
) => {
  const domain = useUpmindDomain({ sync, type, parentId });
  const { state, send } = useActor(domain.service);

  // --------------------------------------------------------

  const choose = (value: string) =>
    send({
      type: "CHOOSE",
      data: value,
    });

  const search = (value: string) =>
    send({
      type: "SEARCH",
      data: {
        domain: value,
      },
    });

  const toggle = (value: string) => {
    const type = some(state.value.context.values, ["domain", value])
      ? "REMOVE"
      : "ADD";

    send({
      type,
      data: value,
    });
  };

  const update = (values: Array<string>) => {
    // NB: nsure we have an array of strings
    send({
      type: "UPDATE",
      data: isArray(values) ? values : [values],
    });
  };

  const add = (value: string) => {
    send({
      type: "ADD",
      data: value,
    });
  };

  const remove = (value: string) => {
    send({
      type: "REMOVE",
      data: value,
    });
  };

  const setPrimaryDomain = (value: string) => {
    send({
      type: "SELECT",
      data: value,
    });
  };

  // --------------------------------------------------------

  return {
    state: computed(() => state.value.value),
    // ---
    choices: computed(() =>
      map(state.value.context.choices, (value, key) => {
        return {
          value: key,
          label: value,
        };
      })
    ),
    query: computed(() => state.value.context.search),
    values: computed(() => state.value.context.values),
    selected: computed(() => map(state.value.context.values, "domain")),
    type: computed(() => state.value.context.type),
    available: computed(() =>
      map(state.value.context.available, item => {
        item.value = item.domain;
        return item;
      })
    ),
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
        "existing.processing",
      ].some(state.value.matches),

      isSyncing: [
        "register.syncing",
        "transfer.syncing",
        "existing.syncing",
        "basket.syncing",
      ].some(state.value.matches),

      isSearching: [
        "register.processing.searching",
        "transfer.processing.searching",
        "existing.processing.idle",
      ].some(state.value.matches),

      hasErrors: [
        "error",
        "register.error",
        "transfer.error",
        "existing.error",
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
          "basket.valid",
        ].some(state.value.matches) &&
        some(state.value.context?.values, "is_primary"),
      // ---
      hasValues: !!state.value.context?.values?.length,
      hasPrimary: some(state.value.context?.values, "is_primary"),
      hasAdditional: state.value.context?.values?.length > 1,
      hasMore:
        !!state.value.context.available.length &&
        state.value.context.available.length < state.value.context.total,
    })),
    // ---
    choose,
    search,
    add,
    remove,
    toggle,
    update,
    setPrimaryDomain,
    isSelected: (value: string) => state.value.matches(value),
    destroy: domain.destroy,
  };
};
