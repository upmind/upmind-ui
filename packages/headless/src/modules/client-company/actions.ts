import { assign } from "xstate";
import { useSchema, useUischema } from "./client-company.schemas";
import { useModelParser } from "../../utils";
import { get, compact, find } from "lodash-es";
import type { CompanyContext, CompanyModel } from "./client-company.types";
import type { AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------

export const useClientCompanyActions = () => {
  return {
    setMeta: assign({
      title: ({ model }: CompanyContext) => model?.name || "New Company",
      description: ({ model, addresses }: CompanyContext) => {
        const address = find(addresses, ["id", model?.addressId]);
        const addressDetails = get(address, "description");
        const companyDetails = compact([
          model?.regNumber ? `Reg #: ${get(model, "company.regNumber")}` : null,
          model?.tax?.number
            ? `Tax #: ${get(model, "company.tax.number")}`
            : null
        ]).join(";");

        return compact([addressDetails, companyDetails]).join(";");
      }
    }),

    setSchemas: assign({
      schema: (context: CompanyContext) => useSchema(context),
      uischema: (context: CompanyContext) => useUischema(context)
    }),

    setModel: assign({
      model: (
        { schema, baseModel }: CompanyContext,
        { data }: AnyEventObject
      ) => useModelParser<CompanyModel>(schema, data, baseModel)
    }),

    refreshContext: assign({
      clientId: ({ clientId }: CompanyContext, { data }: AnyEventObject) => {
        return clientId || data?.clientId;
      }
    })
  };
};

export const useClientCompanyGuards = () => {
  return {
    hasSubscription: ({ clientId }: CompanyContext, _event: AnyEventObject) =>
      !!clientId
  };
};
