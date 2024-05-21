// --- external
import { assign } from "xstate";

// --- utils
import { useSchema, useUischema, useModelParser, spawnItem } from "./utils";

import { find, map, get, compact } from "lodash-es";

// --- types
import type { AddressContext, AddressEvent } from "./types.d";
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
    title: ({ model }: AddressContext, _event: AddressEvent) =>
      model?.name || "New Address",
    description: (
      { model, countries, regions }: AddressContext,
      _event: AddressEvent
    ) => {
      const country = find(countries, ["id", get(model, "country_id")]);
      const region = find(regions, ["id", get(model, "region_id")]);
      return compact([
        get(model, "address_1"),
        get(model, "address_2"),
        get(model, "street"),
        get(model, "city"),
        get(model, "postcode"),
        get(region, "name"),
        get(country, "name"),
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
    model: ({ schema, baseModel }: AddressContext, { data }: AddressEvent) =>
      useModelParser(schema, data, baseModel),
  }),
};
