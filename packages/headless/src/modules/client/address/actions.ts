// --- external
import { assign } from "xstate";

// --- internal
import { useSchema, useUischema } from "./schemas";

// --- utils
import { get, compact } from "lodash-es";
import { useModelParser } from "../../../utils";

// --- types
import { AddressModel, type AddressContext } from "./types";
import type { AnyEventObject } from "xstate";
import { AddressMode } from "@stripe/stripe-js";
import { Client } from "@googlemaps/google-maps-services-js";

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
      ) => useModelParser<AddressModel>(schema, data, baseModel),
    }),
  };
};

export const useClientAddressGuards = () => {
  return {
    hasSubscription: ({ clientId }: AddressContext, _event: AnyEventObject) =>
      !!clientId,
  };
};
