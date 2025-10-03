// --- external

// --- internal
import { useBrand, useI18n, useSession } from "../../..";

// --- utils
import { canBeStored } from "./utils";
import {
  DetailedError,
  ErrorOrigin,
  responseCodes,
  useModelParser,
  useValidation
} from "../../../utils";
import { get, isNil } from "lodash-es";

// --- types
import { BrandConfigKeys } from "@upmind-automation/types";
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
    const config = {
      canStore: canBeStored(gateway),
      mustStore: get(
        data,
        BrandConfigKeys.BILLING_GATEWAY_FORCE_CARD_STORAGE,
        gateway?.store_on_payment_force || false
      ),
      mustAutoPay: get(
        data,
        BrandConfigKeys.BILLING_GATEWAY_FORCE_AUTO_PAYMENT,
        false
      )
    };
    return config;
  });
}

async function parse(
  { schema, model, canStore, mustStore, mustAutoPay }: GatewayContext,
  _event: AnyEventObject
) {
  model = useModelParser(schema, model);
  // Honour the brand settings storage and auto payment
  if (!canStore) {
    model.storeOnPayment = false;
    model.storeOnPaymentAutoPayment = false;
  } else {
    if (mustStore) model.storeOnPayment = true;
    if (mustAutoPay) model.storeOnPaymentAutoPayment = true;
  }

  // If we are not storing, we should not allow auto payment
  if (!isNil(model.storeOnPayment) && !model.storeOnPayment) {
    model.storeOnPaymentAutoPayment = false;
  }

  return Promise.resolve(model);
}

async function validate(
  { schema, model }: GatewayContext,
  _event: AnyEventObject
) {
  // ---
  const { t } = useI18n();
  // Now validate the model as per normal
  const { validate } = useValidation();

  return new Promise((resolve, reject) => {
    if (!schema) return resolve(model);
    const errors = validate(schema, model);
    if (errors?.length) {
      reject(
        new DetailedError(
          t("error.payment_gateway_validation_failed"),
          responseCodes.Unprocessable_Entity,
          ErrorOrigin.Headless,
          errors
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
async function pay({ model }: GatewayContext) {
  return new Promise(resolve => {
    // add the payment details to the model
    /* Here we don't pass 'storeOnPaymentAutoPayment' flag as 'storeOnPaymentAutoPayment' is injected from parent gatewayComponent */
    resolve(model);
  });
}

// -----------------------------------------------------------------------------

export default {
  load,
  parse,
  validate,
  // ---
  pay
};
