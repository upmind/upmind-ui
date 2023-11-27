// --- external
// import { computed } from "vue";
// import { useMachine, useActor, useSelector } from "@xstate/vue";
// import { interpret } from "xstate";
// --- internal
// import { formMachine } from "@upmind/flow";
// --- utils
// import {} from 'lodash-es';

// --------------------------------------------------------

export const useDate = val => {
  const date = val ? new Date(Date.parse(val)) : new Date();
  const yyyy = date.getFullYear();
  let mm = date.getMonth() + 1; // Months start at 0!
  let dd = date.getDate();

  if (dd < 10) dd = "0" + dd;
  if (mm < 10) mm = "0" + mm;

  const parsed = `${yyyy}-${mm}-${dd}`;
  return parsed;
};
