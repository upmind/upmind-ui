// --- external

// --- internal
import { useSession, useBrand } from "../../..";
import { BrandConfigKeys } from "@upmind-automation/types";
// --- utils
import { canBeStored } from "./utils";
import { useValidation } from "../../../utils";
import { isNil, get } from "lodash-es";

// --- types
import type { GatewayEvent, GatewayContext } from "./types";

// --------------------------------------------------------
//  ENUMS

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

async function load({ gateway }: GatewayContext, _event: GatewayEvent) {
  const { isAuthenticated } = useSession();

  await isAuthenticated().catch(error => Promise.reject(error));

  const { isReady, getConfig } = useBrand();

  await isReady();

  // ---
  // check our brand for what to do with card storage and auto payment

  return getConfig([
    BrandConfigKeys.BILLING_GATEWAY_FORCE_CARD_STORAGE,
    BrandConfigKeys.BILLING_GATEWAY_FORCE_AUTO_PAYMENT,
  ]).then(data => {
    return {
      // @ts-ignore
      can_store: canBeStored(gateway),
      must_store: get(
        data,
        BrandConfigKeys.BILLING_GATEWAY_FORCE_CARD_STORAGE,
        gateway?.store_on_payment_force || false
      ),
      must_auto_pay: get(
        data,
        BrandConfigKeys.BILLING_GATEWAY_FORCE_AUTO_PAYMENT,
        false
      ),
    };
  });
}

// --------------------------------------------------------

async function parse(
  { model, can_store, must_store, must_auto_pay }: GatewayContext,
  _event: GatewayEvent
) {
  model ??= {}; // safeguard

  // Honour the brand settings storage and auto payment
  if (!can_store) {
    model.store_on_payment = false;
    model.store_on_payment_auto_payment = false;
  } else {
    if (must_store) model.store_on_payment = true;
    if (must_auto_pay) model.store_on_payment_auto_payment = true;
  }

  // If we are not storing, we should not allow auto payment
  if (!isNil(model.store_on_payment) && !model.store_on_payment) {
    model.store_on_payment_auto_payment = false;
  }

  return Promise.resolve(model);
}

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
    // add the payment details to the model
    /* Here we don't pass 'store_on_payment_auto_payment' flag as 'store_on_payment_auto_payment' is injected from parent gatewayComponent */
    resolve(model);
  });
}

// --------------------------------------------------------
// EXPORTS

export default {
  load,
  parse,
  validate,
  // ---
  update,
};
