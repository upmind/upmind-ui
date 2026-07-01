import { type AnyEventObject, assign } from "xstate";
import { useSchema, useUischema } from "./schemas";
import { useModelParser } from "../../../utils";
import type { GatewayCardContext } from "./types";
import type { GatewayCardData } from "@upmind-automation/types";

// --- types

// -----------------------------------------------------------------------------
// override the macine actions to generate the schema, uischema and model

export default {
  setSchemas: assign({
    schema: (context: GatewayCardContext) => useSchema(context),
    uischema: (context: GatewayCardContext) => useUischema(context)
  }),

  setModel: assign({
    model: ({ schema, model }: GatewayCardContext, { data }: AnyEventObject) =>
      useModelParser<GatewayCardData>(schema, data || model)
  })
};
