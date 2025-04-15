// --- external
import { assign } from "xstate";

// --- internal
import { useSchema, useUischema } from "./schemas";

// --- utils
import { get, compact } from "lodash-es";
import { useModelParser } from "../../../../utils";

// --- types
import type { UnifiedAddressContext, UnifiedAddressModel } from "./types";

// -----------------------------------------------------------------------------

export const useBillingDetailsActions = () => {
  return {
    setMeta: assign({
      title: ({ model }: UnifiedAddressContext) =>
        model?.companyName || model?.name || model?.address1 || "New Address",
      description: ({ model }: UnifiedAddressContext) => {
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
        { data }: { type: string; data: Partial<UnifiedAddressModel> }
      ) => useModelParser<UnifiedAddressModel>(schema, data, baseModel),
    }),
  };
};
