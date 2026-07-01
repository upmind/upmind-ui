import { assign } from "xstate";
import { useSchema, useUischema } from "./schemas";
import { useModelParser } from "../../../utils";
import { get, compact } from "lodash-es";
import type { UnifiedContext, UnifiedModel } from "./types";
import type { AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------

export const useUnifiedActions = () => {
  return {
    setMeta: assign({
      title: ({ model }: UnifiedContext) =>
        model?.company?.name || model?.address?.address1 || "Address",
      description: ({ model }: UnifiedContext) => {
        const address = compact([
          get(model, "address.address1"),
          get(model, "address.address2"),
          get(model, "address.street"),
          get(model, "address.city"),
          get(model, "address.postcode"),
          get(model, "address.region.name"),
          get(model, "address.country.name")
        ]).join(", ");

        const company = compact([
          model?.company?.regNumber
            ? `Reg #: ${get(model, "company.regNumber")}`
            : null,
          model?.company?.tax?.number
            ? `Tax #: ${get(model, "company.tax.number")}`
            : null
        ]).join(";");

        return compact([address, company]).join(";");
      }
    }),

    setSchemas: assign({
      schema: (context: UnifiedContext) => useSchema(context),
      uischema: (context: UnifiedContext) => useUischema(context)
    }),

    setModel: assign({
      model: (
        { schema, baseModel }: UnifiedContext,
        { data }: AnyEventObject
      ) => useModelParser<UnifiedModel>(schema, data, baseModel)
    }),

    refreshContext: assign({
      clientId: ({ clientId }: UnifiedContext, { data }: AnyEventObject) => {
        return clientId || data?.clientId;
      }
    })
  };
};

export const useUnifiedGuards = () => {
  return {
    hasSubscription: ({ clientId }: UnifiedContext, _event: AnyEventObject) =>
      !!clientId
  };
};
