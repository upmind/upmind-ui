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
        model?.details?.company?.companyName ||
        model?.details?.address?.name ||
        model?.details?.address?.address1 ||
        "Address",
      description: ({ model }: UnifiedAddressContext) => {
        const address = compact([
          get(model, "details.address.address1"),
          get(model, "details.address.address2"),
          get(model, "details.address.street"),
          get(model, "details.address.city"),
          get(model, "details.address.postcode"),
          get(model, "details.address.region.name"),
          get(model, "details.address.country.name"),
        ]).join(", ");

        const company = compact([
          model?.details?.company?.regNumber
            ? `Reg #: ${get(model, "details.company.regNumber")}`
            : null,
          model?.details?.company?.vatNumber
            ? `Tax #: ${get(model, "details.company.vatNumber")}`
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
        { data }: { type: string; data: Partial<UnifiedAddressModel> }
      ) => useModelParser<UnifiedAddressModel>(schema, data, baseModel),
    }),
  };
};
