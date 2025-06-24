// --- external
import { assign } from "xstate";

// --- internal
import { useSchema, useUischema } from "./schemas";

// --- utils
import { get, compact } from "lodash-es";
import { useModelParser } from "../../../utils";

// --- types
import type { AnyEventObject } from "xstate";
import type { CompanyContext, CompanyModel } from "./types";

// -----------------------------------------------------------------------------

export const useClientCompanyActions = () => {
  return {
    setMeta: assign({
      title: ({ model }: CompanyContext) => model?.name || "New Company",
      description: ({ model, addresses }: CompanyContext) => {
        let address = null;
        if (addresses && model?.addressId) {
          address = addresses?.find(address => address.id === model.addressId);
        }
        return compact([
          // get(address, "state.context.title"),
          get(address, "state.context.description"),
          model?.regNumber,
          model?.vatNumber,
        ]).join(" | ");
      },
    }),

    setSchemas: assign({
      schema: (context: CompanyContext) => useSchema(context),
      uischema: (context: CompanyContext) => useUischema(context),
    }),

    setModel: assign({
      model: (
        { schema, baseModel }: CompanyContext,
        { data }: AnyEventObject
      ) => useModelParser<CompanyModel>(schema, data, baseModel),
    }),

    refreshContext: assign({
      clientId: ({ clientId }: CompanyContext, { data }: AnyEventObject) => {
        return clientId || data?.clientId;
      },
    }),
  };
};

export const useClientCompanyGuards = () => {
  return {
    hasSubscription: ({ clientId }: CompanyContext, _event: AnyEventObject) =>
      !!clientId,
  };
};
