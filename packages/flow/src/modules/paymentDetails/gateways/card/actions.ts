// --- external
import { assign } from "xstate";

// --- utils
import { useSchema, useUischema, useModelParser } from "./utils";

// --- types
import type { GatewayContext, GatewayEvent } from "../types.d";

// --------------------------------------------------------

// override the macine actions to generate the schema, uischema and model
export default {
  setSchemas: assign({
    schema: (context: GatewayContext, _event: GatewayEvent) =>
      useSchema(context),
    uischema: (context: GatewayContext, _event: GatewayEvent) =>
      useUischema(context)
  }),

  setModel: assign({
    model: ({ schema }: GatewayContext, { data }: GatewayEvent) =>
      useModelParser(schema, data)
  })
};
