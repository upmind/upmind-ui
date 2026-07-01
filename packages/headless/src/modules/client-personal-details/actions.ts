import { assign } from "xstate";
import { useSchema, useUischema } from "./client-personal-details.schemas";
import { useModelParser } from "../../utils";
import type {
  FieldsModel,
  FieldsContext
} from "./client-personal-details.types";
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
      id: ({ id }: FieldsContext, { data }: AnyEventObject) => {
        return id || data?.id;
      }
    })
  };
};

export const useProfileDetailsGuards = () => {
  return {
    hasSubscription: ({ id }: FieldsContext, _event: AnyEventObject) => !!id
  };
};
