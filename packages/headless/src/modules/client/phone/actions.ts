// --- external
import { assign } from "xstate";

// --- utils
import { useModelParser } from "../../../utils";
import { useSchema, useUischema, spawnItem } from "./utils";
import { find, map, get, compact, isObject } from "lodash-es";

// --- types
import type { ActorRef, AnyEventObject } from "xstate";
import type { PhoneContext, PhonesContext } from "./types";
// -----------------------------------------------------------------------------

export const ListingActions = {
  add: assign({
    initial: ({ selected, initial }: PhonesContext) => selected?.id || initial,
    selected: (_context: PhonesContext, { data }: AnyEventObject) => {
      return spawnItem(data); // spawn an actor for the new raw
    },
  }),
  setItems: assign({
    raw: ({ raw }: PhonesContext, { data }: AnyEventObject) =>
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
    title: ({ model }: PhoneContext) => {
      const phone = get(model, "phone");
      if (isObject(phone)) return get(model, "phone.number");
      return get(model, "international_phone");
    },
    description: (
      // TODO: { model, country, types }: PhoneContext,
      { model, country, types }: PhoneContext
    ) => {
      let type = get(model, "type");
      type = get(types, type);
      return compact([get(country, "name"), type?.value]).join(" | ");
    },
  }),
  setSchemas: assign({
    schema: (context: PhoneContext) => useSchema(context),
    uischema: (context: PhoneContext) => useUischema(),
  }),

  setModel: assign({
    model: ({ schema, model }: PhoneContext, { data }: AnyEventObject) => {
      if (!schema) return data ?? model;
      return useModelParser(schema, data ?? model);
    },
  }),
};
