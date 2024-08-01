// --------------------------------------------------------

// --- external
import { computed } from "vue";
import { useActor } from "@xstate/vue";

// --- internal
import type { DomainTypes } from "@upmind/flow";
import { useDomain as useUpmindDomain } from "@upmind/flow";

// --- utils
import { map, some, find, isArray, get } from "lodash-es";

// --- types
// --------------------------------------------------------
// a composable that provides a simple interface to the api requests machine
//  with some state helpers

export const useDomain = (
  {
    values,
    sync,
    type,
    parentId,
  }: {
    values?: Array<string> | string;
    sync?: boolean;
    type?: DomainTypes;
    parentId?: string; // id of basket item machine representing the parent context
  } = {
    values: [],
    sync: false,
    type: undefined,
    parentId: undefined,
  }
) => {
  const domain = useUpmindDomain({ values, sync, type, parentId });
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

  const update = (values: string | Array<string>) => {
    // NB: nsure we have an array of strings
    send({
      type: "UPDATE",
      data: isArray(values) ? values : [values],
    });
  };

  const reset = () => {
    send({
      type: "RESET",
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

  const syncBasket = () => {
    send({
      type: "SYNC",
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
    values: computed(() => map(state.value.context.values, "domain")),
    type: computed(() => state.value.context.type),
    available: computed(() =>
      map(state.value.context.available, item => {
        item.value = item.domain;
        return item;
      })
    ),
    errors: computed(() => state.value.context?.error),
    selected: computed(() => {
      const selected = find(state.value.context?.values, "is_primary");
      return get(selected, "domain");
    }),

    //messages: computed(() => state.value.context?.messages),
    // ---
    meta: computed(() => ({
      isLoading: ["subscribing", "loading"].some(state.value.matches),

      isSyncing: ["dac.syncing", "basket.processing"].some(state.value.matches),

      isSearching: [
        "dac.loading",
        "dac.processing",
        "existing.loading",
        "existing.processing",
        "basket.loading",
      ].some(state.value.matches),

      hasErrors: ["error", "dac.error", "existing.error", "basket.error"].some(
        state.value.matches
      ),

      // ---
      showChoices: !!state.value.context.choices,
      showDac: state.value.matches("dac"),
      showExisting: state.value.matches("existing"),
      showBasket: state.value.matches("basket"),
      showContinue:
        ["dac.valid", "existing.valid", "basket.valid"].some(
          state.value.matches
        ) && some(state.value.context?.values, "is_primary"),
      showPrimaryDomain:
        ["dac.complete", "existing.complete", "basket.complete"].some(
          state.value.matches
        ) && some(state.value.context?.values, "is_primary"),
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
    reset,
    setPrimaryDomain,
    syncBasket,
    isSelected: (value: string) => state.value.matches(value),
    destroy: domain.destroy,
  };
};
