// --- external
import { assign } from "xstate";

// --- internal
import { useSchema, useUischema } from "./schemas";

// --- utils
import { get, compact } from "lodash-es";
import { useModelParser } from "../../../utils";

// --- types
import type { AnyEventObject } from "xstate";
import type { CompanyContext } from "./types";

export const useClientCompanyActions = () => {
  return {
    setMeta: assign({
      title: ({ model }: CompanyContext) => model?.name || "New Company",
      description: ({ model, addresses }: CompanyContext) => {
        let address = null;
        if (addresses && model?.addressId) {
          address = addresses?.findOne(model.addressId);
        }
        return compact([
          // get(address, "state.context.title"),
          get(address, "state.context.description"),
        ]).join(" | ");
      },
    }),

    setSchemas: assign({
      schema: (context: CompanyContext) => useSchema(context),
      uischema: () => useUischema(),
    }),

    setModel: assign({
      model: (
        { schema, baseModel }: CompanyContext,
        { data }: AnyEventObject
      ) => useModelParser(schema, data, baseModel),
    }),
  };
};
