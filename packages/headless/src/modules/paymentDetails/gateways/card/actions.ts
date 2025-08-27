// --- external
import { AnyEventObject, assign } from "xstate";

// --- utils
import { useModelParser } from "../../../../utils";
import { useSchema, useUischema } from "./schemas";
import { GatewayContext } from "../types";

// --- types

// -----------------------------------------------------------------------------
// override the macine actions to generate the schema, uischema and model

export default {
  setSchemas: assign({
    schema: (context: GatewayContext) => useSchema(context),
    uischema: (context: GatewayContext) => useUischema(context)
  }),

  setModel: assign({
    model: ({ schema, model }: GatewayContext, { data }: AnyEventObject) =>
      useModelParser(schema, data || model)
  })
};
