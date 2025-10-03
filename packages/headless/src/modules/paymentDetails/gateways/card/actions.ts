// --- external
import { AnyEventObject, assign } from "xstate";

// --- utils
import { useModelParser } from "../../../../utils";
import { useSchema, useUischema } from "./schemas";
import { GatewayCardContext } from "./types";
import { GatewayCardData } from "@upmind-automation/types";

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
