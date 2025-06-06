// --- external
import { assign } from "xstate";

// --- internal
import { useSchema, useUischema } from "./schemas";

// --- utils
import { get, compact } from "lodash-es";
import { useModelParser } from "../../../utils";

// --- types
import type { AddressContext } from "./types";
import type { AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------

export const useClientAddressActions = () => {
  return {
    setMeta: assign({
      title: ({ model }: AddressContext) =>
        model?.name || model?.address1 || "New Address",
      description: ({ model }: AddressContext) => {
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
      model: (
        { schema, baseModel }: AddressContext,
        { data }: AnyEventObject
      ) => useModelParser(schema, data, baseModel),
    }),
  };
};
