// --- external
import { assign } from "xstate";

// --- utils
import { useSchema, useUischema, useModelParser, spawnItem } from "./utils";

import { find, map, get, compact } from "lodash-es";

// --- types
import type { AddressContext, AddressEvent } from "./types";
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
    title: ({ model }: AddressContext, _event: AddressEvent) =>
      model?.name || "New Address",
    description: (
      // TODO: { model, countries, regions }: AddressContext,
      { model, countries, regions }: any,
      _event: AddressEvent
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
        // get(region, "name"),
        // get(country, "name"),
      ]).join(", ");
    },
  }),

  setSchemas: assign({
    schema: (context: AddressContext, _event: AddressEvent) =>
      useSchema(context),
    uischema: (context: AddressContext, _event: AddressEvent) =>
      useUischema(context),
  }),

  setModel: assign({
    // TODO: model: ({ schema, baseModel }: AddressContext, { data }: AddressEvent) =>
    model: ({ schema, baseModel }: any, { data }: AddressEvent) =>
      useModelParser(schema, data, baseModel),
  }),
};
