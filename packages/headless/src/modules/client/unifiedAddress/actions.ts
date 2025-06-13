// --- external
import { assign } from "xstate";

// --- utils
import { useSchema, useUischema, useModelParser, spawnItem } from "./utils";

import { find, map, get, compact } from "lodash-es";

// --- types
import type { ActorRef, AnyEventObject } from "xstate";
import type { UnifiedAddressContext, UnifiedAddressesContext } from "./types";

// -----------------------------------------------------------------------------

export const ListingActions = {
  add: assign({
    initial: ({ selected, initial }: UnifiedAddressesContext) =>
      selected?.id || initial,
    selected: (_context: UnifiedAddressesContext, { data }: AnyEventObject) => {
      const item = spawnItem(data); // spawn an actor for the new raw
      return item;
    },
  }),
  setItems: assign({
    raw: ({ raw }: UnifiedAddressesContext, { data }: AnyEventObject) =>
      map(data, item => {
        const found = find(raw, ["id", item.id]);
        if (!found) return spawnItem(item);
        return found;
      }) as ActorRef<any>[],
    error: undefined,
  }),
};

export const ItemActions = {
  setMeta: assign({
    title: ({ model }: any) =>
      model?.companyName || model?.name || "New Address",

    description: (
      // TODO: { model, countries, regions }: UnifiedAddressContext,
      { model }: UnifiedAddressContext,
      _event: AnyEventObject
    ) => {
      // BUG: think this is where  our timout error is coming from
      // const country = find(countries, ["id", get(model, "countryId")]);
      // const region = find(regions, ["id", get(model, "regionId")]);
      const address = compact([
        get(model, "address1"),
        get(model, "address2"),
        get(model, "street"),
        get(model, "city"),
        get(model, "postcode"),
        get(model, "region.name"),
        get(model, "country.name"),
      ]).join(", ");

      const company = compact([
        model?.regNumber ? `Reg #: ${get(model, "regNumber")}` : null,
        model?.vatNumber ? `Tax #: ${get(model, "vatNumber")}` : null,
        // model?.vatPercent ? `Tax %: ${get(model, "vatPercent")}` : null,
      ]).join(";");

      return compact([address, company]).join(";");
    },
  }),

  setSchemas: assign({
    schema: (context: UnifiedAddressContext) => useSchema(context),
    uischema: (context: UnifiedAddressContext) => useUischema(context),
  }),

  setModel: assign({
    model: ({ schema, baseModel }: any, { data }: AnyEventObject) =>
      useModelParser(schema, data, baseModel),
  }),
};
