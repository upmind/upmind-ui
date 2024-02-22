// --- external
import { assign } from "xstate";

// --- utils
import { useSchema, useUischema, useModelParser, spawnItem } from "./utils";
import { find, map, get, compact, isObject } from "lodash-es";

// --- types
import type { PhoneContext, PhoneEvent } from "./types.d";
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
    title: ({ model }: PhoneContext, _event: PhoneEvent) => {
      const phone = get(model, "phone");
      if (isObject(phone)) return get(model, "phone.number");
      return get(model, "international_phone");
    },
    description: (
      { model, country, types }: PhoneContext,
      _event: PhoneEvent
    ) => {
      let type = get(model, "type");
      type = get(types, type);
      return compact([get(country, "name"), type?.value]).join(" | ");
    }
  }),
  setSchemas: assign({
    schema: (context: PhoneContext, _event: PhoneEvent) => useSchema(context),
    uischema: (context: PhoneContext, _event: PhoneEvent) =>
      useUischema(context)
  }),

  setModel: assign({
    model: ({ schema }: PhoneContext, { data }: PhoneEvent) =>
      useModelParser(schema, data)
  })
};
