// --- external
import { assign } from "xstate";

// --- utils
import { spawnItem } from "./utils";
import { find, map } from "lodash-es";

// --- types
import type { ClientListingsEvents, ClientListingsContext } from "../types.d";

// --------------------------------------------------------

export const ListingActions = {
  add: assign({
    items: (
      { items }: ClientListingsContext,
      { data }: ClientListingsEvents
    ) => {
      const machine = spawnItem(data); // spawn an actor for the new items
      items.push(machine);
      return items;
    }
  }),
  setItems: assign({
    items: ({ items }: ClientListingsContext, { data }: ClientListingsEvents) =>
      map(data, item => {
        const found = find(items, ["id", item.id]);
        if (!found) return spawnItem(item);
        return found;
      }),
    error: null
  })
};
