// --- external
import { assign } from "xstate";

// --- utils
import { useModelParser } from "../../../utils";
import { useSchema, useUischema, spawnItem } from "./utils";
import { find, map, compact, get } from "lodash-es";

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
    title: ({ model }: CompanyContext, _event: CompanyEvent) => model?.name,
    description: (
      { model, addresses }: CompanyContext,
      _event: CompanyEvent
    ) => {
      let address = null;
      if (addresses && model?.address_id) {
        const addressService = addresses();
        address = addressService?.getItem(model.address_id);
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
    uischema: (context: CompanyContext, _event: CompanyEvent) =>
      useUischema(context),
  }),

  setModel: assign({
    model: ({ schema, model }, { data }) =>
      useModelParser(schema, data || model),
  }),
};
