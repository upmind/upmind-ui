// --- external
import { computed } from "vue";
import { useActor } from "@xstate/vue";

// --- internal
import { useDomain as useUpmindDomain } from "@upmind/flow";

// --- utils
import { map, some } from "lodash-es";
// --------------------------------------------------------
// a composable that provides a simple interface to the api requests machine
//  with some state helpers

export const useDomain = () => {
  const Domain = useUpmindDomain();
  const { state, send } = useActor(Domain.service);

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
    available: computed(() => state.value.context.available),
    errors: computed(() => state.value.context?.error),
    //messages: computed(() => state.value.context?.messages),
    // ---
    meta: computed(() => ({
      isProcessing: [
        "active.register.processing",
        "active.transfer.processing",
        "active.existing.processing"
      ].some(state.value.matches),
      hasErrors: ["error"].some(state.value.matches),
      // ---
      showChoices: ["idle"].some(state.value.matches),
      showRegister: state.value.matches("active.register"),
      showTransfer: state.value.matches("active.transfer"),
      showExisting: state.value.matches("active.existing"),
      // ---
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
    isSelected: (value: string) => state.value.matches(`available.${value}`)
  };
};
