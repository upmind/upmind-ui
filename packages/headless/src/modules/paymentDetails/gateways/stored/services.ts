// --- external

// --- internal
import sharedServices from "../services";

// --- utils
import { useModelParser } from "../../../../utils";
import { unset, find, first } from "lodash-es";

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
async function update({ model }: GatewayContext) {
  return new Promise(resolve => {
    // add the payment details to the model
    /* Here we don't pass 'store_on_payment_auto_payment' flag as 'store_on_payment_auto_payment' is injected from parent gatewayComponent */
    resolve(model);
  });
}

async function parse(
  { model, schema, stored_payment_methods }: GatewayContext,
  _event: any
) {
  model = useModelParser(schema, model);

  // make sure we don't have a gateway_id
  unset(model, "gateway_id");

  // If we have no selected a payment detail id, ensure we  use the default one
  model.payment_details_id ??= find(stored_payment_methods, "default")?.id;

  // Fallback to the first one
  model.payment_details_id ??= first(stored_payment_methods)?.id;

  return Promise.resolve(model);
}

// -----------------------------------------------------------------------------

export default {
  ...sharedServices,
  // ---
  update,
  parse
};
