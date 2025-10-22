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

async function load(
  { gateway, supported }: GatewayContext,
  _event: AnyEventObject
) {
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
      canStore: supported ? canBeStored(gateway) : false,
      mustStore: supported
        ? get(
            data,
            BrandConfigKeys.BILLING_GATEWAY_FORCE_CARD_STORAGE,
            gateway?.store_on_payment_force || false
          )
        : false,
      mustAutoPay: supported
        ? get(data, BrandConfigKeys.BILLING_GATEWAY_FORCE_AUTO_PAYMENT, false)
        : false
    };
    return config;
  });
}

async function parse(
  {
    schema,
    model,
    canStore,
    mustStore,
    mustAutoPay,
    supported
  }: GatewayContext,
  _event: AnyEventObject
) {
  model = useModelParser(schema, model);
  // Honour the brand settings storage and auto payment
  if (!canStore) {
    model.store_on_payment = false;
    model.store_on_payment_auto_payment = false;
  } else {
    if (mustStore) model.store_on_payment = true;
    if (mustAutoPay) model.store_on_payment_auto_payment = true;
  }

  // If we are not storing, we should not allow auto payment
  if (
    !supported ||
    (!isNil(model.store_on_payment) && !model.store_on_payment)
  ) {
    model.store_on_payment_auto_payment = false;
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
  return Promise.resolve(model);
}

// -----------------------------------------------------------------------------

export default {
  load,
  parse,
  validate,
  // ---
  pay
};
