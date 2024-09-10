// --- external
import { assign } from "xstate";

// --- utils
import { useModelParser } from "../../../utils";
import { useSchema, useUischema, spawnItem } from "./utils";
// TODO: import { find, map, compact, get, isFunction } from "lodash-es";
import { find, map, compact, get } from "lodash-es";

// --- types
import type { CompanyContext, CompanyEvent } from "./types.d";
import type { ClientListingsEvents, ClientListingsContext } from "../types.d";

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
    title: ({ model }: CompanyContext, _event: CompanyEvent) => model?.name,
    description: (
      // TODO: { model, addresses }: CompanyContext,
      { model, addresses }: any,
      _event: CompanyEvent
    ) => {
      let address = null;
      if (addresses && model?.address_id) {
        address = addresses?.getItemSnapshot(model.address_id);
      }
      return compact([
        // get(address, "state.context.title"),
        get(address, "state.context.description"),
      ]).join(" | ");
    },
  }),
  setSchemas: assign({
    schema: (context: CompanyContext, _event: CompanyEvent) =>
      useSchema(context),
    // TODO: uischema: (context: CompanyContext, _event: CompanyEvent) =>
    // TODO: useUischema(context),
    uischema: (_, _event: CompanyEvent) => useUischema(),
  }),

  setModel: assign({
    model: ({ schema, model }: any, { data }: any) =>
      useModelParser(schema, data || model),
  }),
};
