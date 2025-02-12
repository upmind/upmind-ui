// --- external
import { AnyEventObject, assign } from "xstate";

// --- utils
import { useSchema, useUischema, useModelParser, spawnItem } from "./utils";
import { find, map } from "lodash-es";

// --- types
import type { ActorRef } from "xstate";
import type { EmailContext, EmailsContext } from "./types";
// -----------------------------------------------------------------------------

export const ListingActions = {
  add: assign({
    initial: ({ selected, initial }: EmailsContext) => selected?.id || initial,
    selected: (_context: EmailsContext, { data }: AnyEventObject) =>
      spawnItem(data), // spawn an actor for the new raw
  }),
  setItems: assign({
    raw: ({ raw }: EmailsContext, { data }: AnyEventObject) =>
      map(data, item => {
        const found = find(raw, ["id", item.id]);
        if (!found) return spawnItem(item);
        return found;
      }) as ActorRef<any>[],
    error: null,
  }),
};

export const ItemActions = {
  setMeta: assign({
    title: ({ model }: EmailContext) => model?.email,
    description: ({ model }: EmailContext) =>
      model?.verified ? "Verified" : "Unverified",
  }),
  setSchemas: assign({
    schema: (_context: EmailContext) => useSchema(),
    uischema: (_context: EmailContext) => useUischema(),
  }),

  setModel: assign({
    model: ({ schema, model }: any, { data }: any) =>
      useModelParser(schema, data || model),
  }),
};
