// --- external

// --- internal
import { useBrand, useSession } from "../../..";
import { BrandConfigKeys } from "@upmind-automation/types";
// --- utils
import { canBeStored } from "./utils";
import {
  DetailedError,
  ErrorOrigin,
  responseCodes,
  useValidation
} from "../../../utils";
import { get, isNil } from "lodash-es";

// --- types
import type { GatewayContext } from "./types";
import type { AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------

async function load({ gateway }: GatewayContext, _event: AnyEventObject) {
  const { isAuthenticated } = useSession();

  await isAuthenticated().catch(error => Promise.reject(error));

  const { isReady, ensureConfig } = useBrand();

  await isReady().catch(error => Promise.reject(error));

  // ---
  // check our brand for what to do with card storage and auto payment

  return ensureConfig([
    BrandConfigKeys.BILLING_GATEWAY_FORCE_CARD_STORAGE,
    BrandConfigKeys.BILLING_GATEWAY_FORCE_AUTO_PAYMENT
  ]).then(data => {
    return {
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
      )
    };
  });
}

async function parse(
  { model, can_store, must_store, must_auto_pay }: GatewayContext,
  _event: AnyEventObject
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
  _event: AnyEventObject
) {
  // ---

  // Now validate the model as per normal
  const { validate } = useValidation();

  return new Promise((resolve, reject) => {
    if (!schema) return resolve(model);
    const errors = validate(schema, model);

    if (errors?.length) {
      reject(
        new DetailedError(
          "[headless] validate on gateway payment details failed",
          responseCodes.Unprocessable_Entity,
          ErrorOrigin.Headless,
          { error: errors }
        )
      );
    } else {
      resolve(model);
    }
  });
}

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

// -----------------------------------------------------------------------------

export default {
  load,
  parse,
  validate,
  // ---
  update
};
