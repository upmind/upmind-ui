// --- external
import { assign } from "xstate";

// --- internal
import { useSchema, useUischema } from "./schemas";

// --- utils
import { useModelParser } from "../../../utils";

// --- types
import { EmailModel, type EmailContext } from "./types";
import type { AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------

export const useProfileDetailsActions = ({ fields }: { fields: any }) => {
  console.log("useProfileDetailsActions: ", fields);

  return {
    setMeta: assign({
      title: ({ model }: EmailContext) => model?.email || "New Email",
      description: ({ model }: EmailContext) => ""
    }),

    setSchemas: assign({
      schema: useSchema({ fields }),
      uischema: useUischema({ fields })
    }),

    setModel: assign({
      model: ({ schema, baseModel }: EmailContext, { data }: AnyEventObject) =>
        useModelParser<EmailModel>(schema, data, baseModel)
    }),

    refreshContext: assign({
      clientId: ({ clientId }: EmailContext, { data }: AnyEventObject) => {
        return clientId || data?.clientId;
      }
    })
  };
};

export const useProfileDetailsGuards = () => {
  return {
    hasSubscription: ({ clientId }: EmailContext, _event: AnyEventObject) =>
      !!clientId
  };
};
