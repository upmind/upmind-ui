// --- external
import { AnyEventObject, assign } from "xstate";

// --- utils
import { useSchema, useUischema, useModelParser, spawnItem } from "./utils";

import { find, map, get, compact } from "lodash-es";

// --- types
import type { ActorRef } from "xstate";
import type { AddressContext, AddressesContext, IAddressData } from "./types";

// -----------------------------------------------------------------------------

export const ListingActions = {
  add: assign({
    initial: ({ selected, initial }: AddressesContext) =>
      selected?.id || initial,
    selected: (_context: AddressesContext, { data }: AnyEventObject) =>
      spawnItem(data), // spawn an actor for the new raw
  }),
  setItems: assign({
    raw: ({ raw }: AddressesContext, { data }: AnyEventObject) => {
      return map(data, item => {
        const found = find(raw, ["id", item.id]);
        if (!found) return spawnItem(item);
        return found;
      }) as ActorRef<any>[];
    },
    error: undefined,
  }),
};

export const ItemActions = {
  setMeta: assign({
    title: ({ model }: AddressContext) => model?.name || "New Address",
    description: (
      // TODO: { model, countries, regions }: AddressContext,
      { model }: any
    ) => {
      // BUG: Think this is the source of our timeout son address lookups
      // const country = find(countries, ["id", get(model, "countryId")]);
      // const region = find(regions, ["id", get(model, "regionId")]);
      return compact([
        get(model, "address1"),
        get(model, "address2"),
        get(model, "street"),
        get(model, "city"),
        get(model, "postcode"),
        get(model, "region.name"),
        get(model, "country.name"),
      ]).join(", ");
    },
  }),

  setSchemas: assign({
    schema: (context: AddressContext) => useSchema(context),
    uischema: (context: AddressContext) => useUischema(context),
  }),

  setModel: assign({
    // TODO: model: ({ schema, baseModel }: AddressContext, { data }: AddressEvent) =>
    // model: ({ schema, baseModel }: AddressContext, { data }: AddressEvent) =>
    //   useModelParser(schema, data, baseModel),

    model: (
      { schema, baseModel }: AddressContext,
      { data }: AnyEventObject
    ) => {
      if (!schema) {
        throw new Error("Schema is undefined");
      }
      return useModelParser(schema, data, baseModel);
    },
  }),
};
