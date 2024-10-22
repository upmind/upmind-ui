// --- external
import { assign } from "xstate";

// --- utils
import { useSchema, useUischema, useModelParser, spawnItem } from "./utils";

import { find, map, get, compact } from "lodash-es";

// --- types
import type { UnifiedAddressContext, UnifiedAddressEvent } from "./types";
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
    // TODO: title: ({ model }: UnifiedAddressContext, _event: UnifiedAddressEvent) =>
    title: ({ model }: any, _event: UnifiedAddressEvent) =>
      model?.company_name || model?.name || "New Address",
    description: (
      // TODO: { model, countries, regions }: UnifiedAddressContext,
      { model, countries, regions }: any,
      _event: UnifiedAddressEvent
    ) => {
      const country = find(countries, ["id", get(model, "country_id")]);
      const region = find(regions, ["id", get(model, "region_id")]);
      const address = compact([
        get(model, "address_1"),
        get(model, "address_2"),
        get(model, "street"),
        get(model, "city"),
        get(model, "postcode"),
        get(region, "name"),
        get(country, "name"),
      ]).join(", ");

      const company = compact([
        model?.reg_number ? `Reg #: ${get(model, "reg_number")}` : null,
        model?.vat_number ? `Tax #: ${get(model, "vat_number")}` : null,
        // model?.vat_percent ? `Tax %: ${get(model, "vat_percent")}` : null,
      ]).join(";");

      return compact([address, company]).join(";");
    },
  }),

  setSchemas: assign({
    schema: (context: UnifiedAddressContext, _event: UnifiedAddressEvent) =>
      useSchema(context),
    uischema: (context: UnifiedAddressContext, _event: UnifiedAddressEvent) =>
      useUischema(context),
  }),

  setModel: assign({
    model: (
      // TODO: { schema, baseModel }: UnifiedAddressContext,
      { schema, baseModel }: any,
      { data }: UnifiedAddressEvent
    ) => {
      const model = useModelParser(schema, data, baseModel);
      return model;
    },
  }),
};
