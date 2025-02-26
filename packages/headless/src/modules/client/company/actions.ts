// --- external
import { assign, type AnyEventObject } from "xstate";

// --- utils
import { useModelParser } from "../../../utils";
import { useSchema, useUischema, spawnItem } from "./utils";
import { find, map, compact, get } from "lodash-es";

// --- types
import type { ActorRef } from "xstate";
import type { CompanyContext, CompaniesContext } from "./types";

// -----------------------------------------------------------------------------

export const ListingActions = {
  add: assign({
    initial: ({ selected, initial }: CompaniesContext) =>
      selected?.id || initial,
    selected: (_context: CompaniesContext, { data }: AnyEventObject) => {
      return spawnItem(data); // spawn an actor for the new raw
    },
  }),
  setItems: assign({
    raw: ({ raw }: CompaniesContext, { data }: AnyEventObject) =>
      map(data, item => {
        const found = find(raw, ["id", item.id]);
        return found || spawnItem(item);
      }) as ActorRef<any>[],
    error: null,
  }),
};

export const ItemActions = {
  setMeta: assign({
    title: ({ model }: CompanyContext) => model?.name,
    description: ({ model, addresses }: CompanyContext) => {
      let address = null;
      if (addresses && model?.addressId) {
        address = addresses?.getItemSnapshot(model.addressId);
      }
      return compact([
        // get(address, "state.context.title"),
        get(address, "state.context.description"),
      ]).join(" | ");
    },
  }),
  setSchemas: assign({
    schema: (context: CompanyContext) => useSchema(context),
    uischema: (_context: CompanyContext) => useUischema(),
  }),

  setModel: assign({
    model: ({ schema, model }: any, { data }: any) =>
      useModelParser(schema, data || model),
  }),
};
