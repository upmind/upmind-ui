// --- external
import { assign } from "xstate";

// --- utils
import { find, map } from "lodash-es";

// --- types
import type { ClientListingsEvents, ClientListingsContext } from "../types";
// --------------------------------------------------------

export const actions = {
  add: assign({
    raw: ({ raw }: ClientListingsContext, { data }: ClientListingsEvents) =>
      data
  }),
  setItems: assign({
    raw: [],
    error: null
  })
};
