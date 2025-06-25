// --- external
import { assign } from "xstate";

// --- internal
import { useSchema, useUischema } from "./schemas";

// --- utils
import { get, compact } from "lodash-es";
import { useModelParser } from "../../../../utils";

// --- types
import type { UnifiedAddressContext, UnifiedAddressModel } from "./types";
import type { AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------

export const useUnifiedAddressActions = () => {
  return {
    setMeta: assign({
      title: ({ model }: UnifiedAddressContext) =>
        model?.company?.name ||
        model?.address?.name ||
        model?.address?.address1 ||
        "Address",
      description: ({ model }: UnifiedAddressContext) => {
        const address = compact([
          get(model, "address.address1"),
          get(model, "address.address2"),
          get(model, "address.street"),
          get(model, "address.city"),
          get(model, "address.postcode"),
          get(model, "address.region.name"),
          get(model, "address.country.name"),
        ]).join(", ");

        const company = compact([
          model?.company?.regNumber
            ? `Reg #: ${get(model, "company.regNumber")}`
            : null,
          model?.company?.vatNumber
            ? `Tax #: ${get(model, "company.vatNumber")}`
            : null,
        ]).join(";");

        return compact([address, company]).join(";");
      },
    }),

    setSchemas: assign({
      schema: (context: UnifiedAddressContext) => useSchema(context),
      uischema: (context: UnifiedAddressContext) => useUischema(context),
    }),

    setModel: assign({
      model: (
        { schema, baseModel }: UnifiedAddressContext,
        { data }: AnyEventObject
      ) => useModelParser<UnifiedAddressModel>(schema, data, baseModel),
    }),

    refreshContext: assign({
      clientId: (
        { clientId }: UnifiedAddressContext,
        { data }: AnyEventObject
      ) => {
        return clientId || data?.clientId;
      },
    }),
  };
};

export const useUnifiedAddressGuards = () => {
  return {
    hasSubscription: (
      { clientId }: UnifiedAddressContext,
      _event: AnyEventObject
    ) => !!clientId,
  };
};
