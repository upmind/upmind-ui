// --- external
import { assign } from "xstate";

// --- internal
import { useSchema, useUischema } from "./schemas";

// --- utils
import { useModelParser } from "../../../utils";

// --- types
import { FieldsModel, type FieldsContext } from "./types";
import type { AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------

export const useProfileDetailsActions = () => {
  return {
    setSchemas: assign({
      schema: (context: FieldsContext) => {
        return useSchema(context);
      },
      uischema: (context: FieldsContext) => {
        return useUischema(context);
      }
    }),

    setModel: assign({
      model: (
        { schema, baseModel }: FieldsContext,
        { data }: AnyEventObject
      ) => {
        return useModelParser<FieldsModel>(schema, data, baseModel);
      }
    }),

    refreshContext: assign({
      clientId: ({ clientId }: FieldsContext, { data }: AnyEventObject) => {
        return clientId || data?.clientId;
      }
    })
  };
};

export const useProfileDetailsGuards = () => {
  return {
    hasSubscription: ({ clientId }: FieldsContext, _event: AnyEventObject) =>
      !!clientId
  };
};
