// --- external
import { assign } from "xstate";

// --- utils
import { useModelParser } from "../../../utils";
import { useSchema, useUischema, spawnItem } from "./utils";
import { find, map, get, compact, isObject } from "lodash-es";

// --- types
import type { PhoneContext, PhoneEvent } from "./types";
import type { ClientListingsEvents, ClientListingsContext } from "../types";
// --------------------------------------------------------

export const ListingActions = {
  add: assign({
    initial: ({ selected, initial }) => selected?.id || initial,
    selected: (
      _context: ClientListingsContext,
      { data }: ClientListingsEvents
    ) => {
      return spawnItem(data); // spawn an actor for the new raw
    },
  }),
  setItems: assign({
    raw: ({ raw }: ClientListingsContext, { data }: ClientListingsEvents) =>
      map(data, item => {
        const found = find(raw, ["id", item.id]);
        if (!found) return spawnItem(item);
        return found;
      }),
    error: null,
  }),
};

export const ItemActions = {
  setMeta: assign({
    // @ts-ignore
    title: ({ model }: PhoneContext, _event: PhoneEvent) => {
      const phone = get(model, "phone");
      if (isObject(phone)) return get(model, "phone.number");
      debugger;
      // DC: Maybe this is raw data or needs to be converted to camelCase
      return get(model, "international_phone");
    },
    description: (
      // TODO: { model, country, types }: PhoneContext,
      { model, country, types }: any,
      _event: PhoneEvent
    ) => {
      let type = get(model, "type");
      type = get(types, type);
      return compact([get(country, "name"), type?.value]).join(" | ");
    },
  }),
  setSchemas: assign({
    schema: (context: PhoneContext, _event: PhoneEvent) => useSchema(context),
    // TODO: uischema: (context: PhoneContext, _event: PhoneEvent) =>
    // TODO: useUischema(context),
    uischema: (_context, _event: PhoneEvent) => useUischema(),
  }),

  setModel: assign({
    model: ({ schema, model }: any, { data }: any) =>
      useModelParser(schema, data || model),
  }),
};
