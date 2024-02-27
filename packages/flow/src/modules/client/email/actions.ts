// --- external
import { assign } from "xstate";

// --- utils
import { useModelParser } from "../../../utils";
import { useSchema, useUischema, spawnItem } from "./utils";
import { find, map } from "lodash-es";

// --- types
import type { EmailContext, EmailEvent } from "./types.d";
import type { ClientListingsEvents, ClientListingsContext } from "../types.d";
// --------------------------------------------------------

export const ListingActions = {
  add: assign({
    raw: ({ raw }: ClientListingsContext, { data }: ClientListingsEvents) => {
      const machine = spawnItem(data); // spawn an actor for the new raw
      raw.push(machine);
      return raw;
    }
  }),
  setItems: assign({
    raw: ({ raw }: ClientListingsContext, { data }: ClientListingsEvents) =>
      map(data, item => {
        const found = find(raw, ["id", item.id]);
        if (!found) return spawnItem(item);
        return found;
      }),
    error: null
  })
};

export const ItemActions = {
  setMeta: assign({
    title: ({ model }: EmailContext, _event: EmailEvent) => model?.email,
    description: ({ model }: EmailContext, _event: EmailEvent) =>
      model?.verified ? "Verified" : "Unverified"
  }),
  setSchemas: assign({
    schema: (context: EmailContext, _event: EmailEvent) => useSchema(context),
    uischema: (context: EmailContext, _event: EmailEvent) =>
      useUischema(context)
  }),

  setModel: assign({
    model: ({ schema, model }, { data }) =>
      useModelParser(schema, data || model)
  })
};
