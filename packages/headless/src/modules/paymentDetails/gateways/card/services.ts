// --- external

// --- internal
import sharedServices from "../services";

// --- utils

// --- types
import type { GatewayContext } from "../types";

// ---   ENUMS

// ---  SERVICE METHODS
// Invoked by machines, providing context and event data

// ---  PAYMENT METHODS

/**
 * @name getPaymentData
 * @desc Here we create a new payment detail via the Card SDK, and return
 * the payment detail ID which we later relay to the BE (when executing
 * payment). We do not need to pass a client secret for flow, as the
 * payment detail is attached to a customer and confirmed server-side.
 */
async function update({ model }: GatewayContext) {
  return new Promise(resolve => {
    // add the payment details to the model
    /* Here we don't pass 'store_on_payment_auto_payment' flag as 'store_on_payment_auto_payment' is injected from parent gatewayComponent */
    resolve(model);
  });
}

// ---  EXPORTS

export default {
  ...sharedServices,
  // ---
  update,
};
