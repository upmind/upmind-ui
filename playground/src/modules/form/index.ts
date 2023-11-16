// --- external
// import { computed } from "vue";
// import { useMachine, useActor, useSelector } from "@xstate/vue";
// import { interpret } from "xstate";
// --- internal
// import { formMachine } from "@upmind/flow";
// --- utils
// import {} from 'lodash-es';

// --------------------------------------------------------

export function useForm() {
  // ---
  // const {
  //   state,
  //   send,
  //   service = shared
  // } = useGlobal
  //   ? useActor(shared)
  //   : useMachine(formMachine, { devTools: false });

  // // ---
  // function reset() {
  //   send("RESET");
  // }

  // function submit(model) {
  //   send({ type: "SUBMIT", data: model });
  // }
  // ---
  return {
    // send,
    // state: computed(() => state.value.value),
    // context: computed(() => state.value.context),
    // errors: computed(() => state.value.context?.error),
    // //messages: computed(() => state.value.context?.messages),
    // // ---
    // meta: computed(() => ({
    //   isLoading: ["starting"].some(state.value.matches),
    //   hasErrors: ["starting.status.error"].some(state.value.matches),
    //   isValid: ["valid"].some(state.value.matches),
    //   isDisabled: ["disabled"].some(state.value.matches),
    //   isProcessing: ["processing"].some(state.value.matches)
    // })),
    // // ---
    // submit,
    // reset
  };
}
