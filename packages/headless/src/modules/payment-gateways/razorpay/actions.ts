// --- external
import { assign } from "xstate";

// --- internal
import { useSchema, useUischema } from "./schemas";

// --- types
import type { RazorpayContext } from "./types";

// -----------------------------------------------------------------------------
// Override the machine actions to generate the payer-email-aware schema/uischema
// so the Razorpay modal prefills when the payer has no email on file.

export default {
  setSchemas: assign({
    schema: (context: RazorpayContext) => useSchema(context),
    uischema: (context: RazorpayContext) => useUischema(context)
  })
};
