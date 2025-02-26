// --------------------------------------------------------

// --- external
import { computed } from "vue";
import { useActor } from "@xstate/vue";

// --- internal
import type { DomainTypes } from "@upmind-automation/headless";
import { useDomain as useUpmindDomain } from "@upmind-automation/headless";

// --- utils
import { map, some, find, isArray, get, first, debounce } from "lodash-es";

// --- types
export { DomainTypes, type DomainLookup } from "@upmind-automation/headless";
// --------------------------------------------------------
// a composable that provides a simple interface to the api requests machine
//  with some state helpers

export const useDomain = (
  {
    model,
    sync,
    type,
    parentId,
  }: {
    model?: string;
    sync?: boolean;
    type?: DomainTypes;
    parentId?: string; // id of basket item machine representing the parent context
  } = {
    model: undefined,
    sync: false,
    type: undefined,
    parentId: undefined,
  }
): any => {
  const domain = useUpmindDomain({ model, sync, type, parentId });
  const { state, send }: any = useActor(domain.service);

  // --------------------------------------------------------

  const choose = (value: string) =>
    send({
      type: "CHOOSE",
      data: value,
    });

  const search = (query: string) => {
    send({ type: "SEARCH", data: query });
  };

  const searchMore = () => {
    send({ type: "SEARCH.OFFSET" });
  };

  const toggle = (value: string) => {
    const type = some(state.value.context.model, ["domain", value])
      ? "REMOVE"
      : "ADD";
    send({
      type,
      data: value,
    });
  };

  const update = (model: string | Array<string>) => {
    // NB: nsure we have an array of strings
    send({
      type: "UPDATE",
      data: isArray(model) ? model : [model],
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
    query: computed(() => state.value.context.search?.query),
    model: computed(() => map(state.value.context.model, "domain")),
    type: computed(() => state.value.context.type),
    // ---
    owned: computed(() => state.value.context.lookups?.owned),
    basket: computed(() => state.value.context.lookups?.basket),
    available: computed(() => state.value.context.lookups?.searched),

    // ---
    errors: computed(() => state.value.context?.error),
    selected: computed(() => {
      const selected =
        find(state.value.context?.model, "isPrimary") ||
        first(state.value.context?.model);
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

      isSearchingMore:
        ["dac.loading", "dac.processing"].some(state.value.matches) &&
        state.value.context?.search?.offset > 0,

      hasMoreSearchResults:
        ["dac"].some(state.value.matches) &&
        state.value.context?.search?.offset +
          state.value.context?.search?.limit <
          state.value.context?.search?.total,

      hasErrors: ["error", "dac.error", "existing.error", "basket.error"].some(
        state.value.matches
      ),

      // ---
      showChoices: !!state.value.context.choices,
      showDac: state.value.matches("dac"),
      showExisting: state.value.matches("existing"),
      showBasket: state.value.matches("basket"),

      isValid:
        ["dac.valid", "existing.valid", "basket.valid"].some(
          state.value.matches
        ) && !!state.value.context?.model?.length,
      showPrimaryDomain:
        ["dac.complete", "existing.complete", "basket.complete"].some(
          state.value.matches
        ) && !!state.value.context?.model?.length,
    })),
    // ---
    choose,
    search: debounce(search, 500),
    searchMore,
    searchOffset: computed(() => state.value.context?.search?.offset),
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
