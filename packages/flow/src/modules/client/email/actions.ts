// --- external
import { assign } from "xstate";

// --- utils
import { useSchema, useUischema, useModelParser, spawnItem } from "./utils";
import { find, map } from "lodash-es";

// --- types
import type { EmailContext, EmailEvent } from "./types.d";
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

export const ItemActions = {
  setSchemas: assign({
    schema: (context: EmailContext, _event: EmailEvent) => useSchema(context),
    uischema: (context: EmailContext, _event: EmailEvent) =>
      useUischema(context),
    title: ({ model }: EmailContext, _event: EmailEvent) => model?.email,
    description: ({ model }: EmailContext, _event: EmailEvent) =>
      model.verified ? "Verified" : "Not verified"
  }),

  setModel: assign({
    model: ({ schema }: EmailContext, { data }: EmailEvent) =>
      useModelParser(schema, data)
  })
};
