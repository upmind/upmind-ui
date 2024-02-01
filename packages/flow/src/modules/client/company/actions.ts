// --- external
import { assign } from "xstate";

// --- utils
import { useSchema, useUischema, useModelParser, spawnItem } from "./utils";
import { find, map } from "lodash-es";

// --- types
import type { CompanyContext, CompanyEvent } from "./types.d";
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
  setSchemas: assign({
    schema: (context: CompanyContext, _event: CompanyEvent) =>
      useSchema(context),
    uischema: (context: CompanyContext, _event: CompanyEvent) =>
      useUischema(context)
  }),

  setModel: assign({
    model: ({ schema }: CompanyContext, { data }: CompanyEvent) =>
      useModelParser(schema, data)
  })
};
