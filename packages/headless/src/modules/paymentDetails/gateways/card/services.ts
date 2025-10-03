// --- external

// --- internal
import sharedServices from "../services";

// --- utils

// --- types
import type { GatewayContext } from "../types";

// -----------------------------------------------------------------------------

/**
 * @name getPaymentData
 * @desc Here we create a new payment detail via the Card SDK, and return
 * the payment detail ID which we later relay to the BE (when executing
 * payment). We do not need to pass a client secret for flow, as the
 * payment detail is attached to a customer and confirmed server-side.
 */
async function pay({ model }: GatewayContext) {
  return new Promise(resolve => {
    // add the payment details to the model
    /* Here we don't pass 'storeOnPaymentAutoPayment' flag as 'storeOnPaymentAutoPayment' is injected from parent gatewayComponent */
    resolve(model);
  });
}

// -----------------------------------------------------------------------------

export default {
  ...sharedServices,
  // ---
  pay
};
