// --- external

// --- internal
import { useApi, useSession } from "../../..";

// --- utils
import { set } from "lodash-es";

// --- types
import type { GenericEvent, GenericContext } from "./types";

// --------------------------------------------------------
//  ENUMS

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data
async function load(_context: GenericContext, _event: GenericEvent) {
  // we have nothing to load, so we return a resolved promise
  return Promise.resolve();
}

// --------------------------------------------------------
// PAYMENT METHODS

/**
 * @name getPaymentData
 * @desc Here we create a new payment detail via the Generic SDK, and return
 * the payment detail ID which we later relay to the BE (when executing
 * payment). We do not need to pass a client secret for flow, as the
 * payment detail is attached to a customer and confirmed server-side.
 */
async function makePayment({ gateway, model }: GenericContext) {
  return new Promise((resolve, reject) => {
    if (!gateway?.id) {
      reject("No gateway ID provided");
    } else {
      model ??= {}; // safety check
      // add the payment details to the model
      set(model, "gateway_id", gateway.id);
      resolve(model);
    }
  });
}

// --------------------------------------------------------
// EXPORTS

export default {
  load,
  makePayment
};
