// --- external
import { assign } from "xstate";

// --- utils
import { find } from "lodash-es";

// --- types
import type { ClientListingsEvents, ClientListingsContext } from "../types";
// --------------------------------------------------------

export const actions = {
  add: assign({
    raw: (_context: ClientListingsContext, { data }: ClientListingsEvents) =>
      data
  }),
  setItems: assign({
    raw: [],
    error: null
  }),
  setSelected: assign({
    selected: (
      { items }: ClientListingsContext,
      { data }: ClientListingsEvents
    ) => find(items, ["id", data]),
    initial: undefined,
    filters: undefined
  }),

  setInitial: assign(
    (_context: ClientListingsContext, { data }: ClientListingsEvents) => data
  )
};
