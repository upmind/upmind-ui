// --- external

// --- internal

// --- utils
import { useValidation } from "../../../../utils";

// --- types
import type { GatewayEvent, GatewayContext } from "../types.d";

// --------------------------------------------------------
//  ENUMS

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

async function validate(
  { schema, model }: GatewayContext,
  _event: GatewayEvent
) {
  // ---

  // Now validate the model as per normal
  const { validate } = useValidation();

  return new Promise((resolve, reject) => {
    const errors = validate(schema, model);
    if (errors?.length) {
      reject({ error: errors });
    } else {
      resolve(model);
    }
  });
}

// --------------------------------------------------------
// PAYMENT METHODS

/**
 * @name getPaymentData
 * @desc Here we create a new payment detail via the Card SDK, and return
 * the payment detail ID which we later relay to the BE (when executing
 * payment). We do not need to pass a client secret for flow, as the
 * payment detail is attached to a customer and confirmed server-side.
 */
async function update({ model }: GatewayContext) {
  return new Promise(resolve => {
    resolve(model);
  });
}

// --------------------------------------------------------
// EXPORTS

export default {
  load: () => Promise.resolve({}), // no need to load anything
  parse: () => Promise.resolve({}), // no need to parse anything
  validate,
  // ---
  update
};
