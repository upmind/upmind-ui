// --- external
import { assign } from "xstate";

// --- internal
import { useSchema, useUischema } from "./schemas";

// --- types
import type { GatewayContext } from "../types";

// -----------------------------------------------------------------------------
// The dLocal redirect gateway uses the generic services; only the schema is
// overridden to collect the payer document (+ email/phone when missing).

export default {
  actions: {
    setSchemas: assign({
      schema: (context: GatewayContext) => useSchema(context),
      uischema: (context: GatewayContext) => useUischema(context)
    })
  }
};
