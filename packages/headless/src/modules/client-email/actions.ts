import { assign } from "xstate";
import { useSchema, useUischema } from "./client-email.schemas";
import { useModelParser } from "../../utils";
import type { EmailModel, EmailContext } from "./client-email.types";
import type { AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------

export const useClientEmailActions = () => {
  return {
    setMeta: assign({
      title: ({ model }: EmailContext) => model?.email || "New Email",
      description: ({ model: _model }: EmailContext) => ""
    }),

    setSchemas: assign({
      schema: useSchema(),
      uischema: useUischema()
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

export const useClientEmailGuards = () => {
  return {
    hasSubscription: ({ clientId }: EmailContext, _event: AnyEventObject) =>
      !!clientId
  };
};
