// --- external
import { assign } from "xstate";

// --- utils
import { find } from "lodash-es";

// --- types
import type { AnyEventObject } from "xstate";
import type { ClientListingsContext } from "../types";
// -----------------------------------------------------------------------------

export const actions = {
  add: assign({
    raw: (_context: ClientListingsContext, { data }: AnyEventObject) => data,
  }),
  setItems: assign({
    raw: [],
    error: null,
  }),
  setSelected: assign({
    selected: ({ items }: ClientListingsContext, { data }: AnyEventObject) =>
      find(items, ["id", data]),
    initial: undefined,
    filters: undefined,
  }),

  setInitial: assign(
    (_context: ClientListingsContext, { data }: AnyEventObject) => data
  ),
};
