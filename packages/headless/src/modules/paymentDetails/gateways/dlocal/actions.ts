// --- external
import { type AnyEventObject, assign } from "xstate";

// --- internal

// --- utils
import {
  responseCodes,
  type ErrorObject,
  ErrorOrigin,
  type ResponseError,
  useModelParser
} from "../../../../utils";
import { useSchema, useUischema } from "./schemas";
import { forEach } from "lodash-es";

// --- types
import type { DLocalContext, DLocalModel } from "./types";

// -----------------------------------------------------------------------------
// Override the machine actions to generate the schema, uischema and model

export default {
  setSchemas: assign({
    schema: (context: DLocalContext) => useSchema(context),
    uischema: (context: DLocalContext) => useUischema(context)
  }),

  setModel: assign({
    model: ({ schema, model }: DLocalContext, { data }: AnyEventObject) =>
      useModelParser<DLocalModel>(schema, data ?? model ?? {})
  }),

  setErrorSDK: assign({
    error: (_context: DLocalContext, { data }: AnyEventObject) => {
      // dLocal card field is invalid if the change event is NOT complete
      if (!data?.complete) {
        return {
          data: [
            {
              instancePath: "/payment_method_addition",
              schemaPath: "#/properties/payment_method_addition",
              keyword: "required",
              params: {
                missingProperty: "payment_method_addition"
              }
            }
          ] as ErrorObject[],
          origin: ErrorOrigin.External,
          code: responseCodes.Unprocessable_Entity
        } as ResponseError;
      }

      return undefined;
    }
  }),

  cleanupSdk: ({ sdk }: DLocalContext) => {
    if (sdk?.fields) {
      forEach(sdk.fields, field => {
        if (field?.unmount) field.unmount();
      });
    }
  }
};
