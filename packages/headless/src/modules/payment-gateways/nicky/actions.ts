// --- external
import { type AnyEventObject, assign } from "xstate";

// --- internal
import { useSchema, useUischema } from "./schemas";

// --- utils
import { useModelParser } from "../../../utils";

// --- types
import type { GatewayData } from "@upmind-automation/types";
import type { NickyContext } from "./types";

// -----------------------------------------------------------------------------
// Override the machine actions to generate the guest-aware schema, uischema and model

export default {
  setSchemas: assign({
    schema: (context: NickyContext) => useSchema(context),
    uischema: (context: NickyContext) => useUischema(context)
  }),

  setModel: assign({
    model: ({ schema, model }: NickyContext, { data }: AnyEventObject) =>
      useModelParser<GatewayData>(schema, data ?? model ?? {})
  })
};
