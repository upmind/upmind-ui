// ---
// --- external
import { computed } from "vue";
import { useActor } from "@xstate/vue";

// --- internal
import type { DomainTypes } from "./";
import { useDomain as useUpmindDomain } from "./";

// --- utils
import { map, find, get, first, debounce } from "lodash-es";
import { DEBOUNCE_DELAY } from "../../utils";

// --- types

// -----------------------------------------------------------------------------

export const useDomain = ({
  model,
  type,
}: {
  model?: string;
  type?: DomainTypes;
} = {}) => {
  const domain = useUpmindDomain({ model, type });
  const { state }: any = useActor(domain.service);

  // ---------------------------------------------------------------------------
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
        find(state.value.context?.model, "selected") ||
        first(state.value.context?.model);
      return get(selected, "domain");
    }),

    //messages: computed(() => state.value.context?.messages),
    // ---
    meta: computed(() => ({
      isLoading: ["subscribing", "loading"].some(state.value.matches),

      isSyncing: ["dac.processingBasket", "basket.processing"].some(
        state.value.matches
      ),

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
      showSelected:
        ["dac.complete", "existing.complete", "basket.complete"].some(
          state.value.matches
        ) && !!state.value.context?.model?.length,
    })),
    // ---
    choose: domain.choose,
    search: debounce(domain.search as (value: string) => void, DEBOUNCE_DELAY),
    searchMore: domain.searchMore,
    searchOffset: computed<number>(() => state.value.context?.search?.offset),
    add: domain.add,
    remove: domain.remove,
    toggle: domain.toggle,
    update: domain.update,
    reset: domain.reset,
    select: domain.select,
    addToBasket: domain.addToBasket,
    isSelected: domain.isSelected,
    stop: domain.stop,
  };
};
