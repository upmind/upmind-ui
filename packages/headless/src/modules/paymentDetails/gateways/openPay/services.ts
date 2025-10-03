// --- external

// --- internal
import sharedServices from "../services";

// --- utils
import {
  ErrorOrigin,
  DetailedError,
  responseCodes,
  useScripts
} from "../../../../utils";

// --- types
import { OPENPAY_FIELDS, OpenPayContext } from "./types";
import type { AnyEventObject } from "xstate";

// --- utils

// --- types
import type { GatewayContext } from "../types";
import { parseSettings } from "../utils";
import { omit } from "lodash-es";

// -----------------------------------------------------------------------------

async function load(context: OpenPayContext, _event: AnyEventObject) {
  //  first get our default load config
  const { gateway } = context;

  if (!gateway)
    return Promise.reject(
      new DetailedError(
        "Gateway not found.",
        responseCodes.Not_Found,
        ErrorOrigin.Headless
      )
    );

  return sharedServices.load(context, _event).then(async config => {
    const settings = parseSettings(gateway);

    // load in our OpenPay scripts
    await Promise.all([
      useScripts().load(
        "openPay_v1",
        "https://js.openpay.mx/openpay.v1.min.js",
        {
          onSuccess: () => {
            return true;
          },
          onError: () => {
            return false;
          }
        }
      ),
      useScripts().load(
        "openPayData_v1",
        "https://js.openpay.mx/openpay-data.v1.min.js",
        {
          onSuccess: () => {
            return true;
          },
          onError: () => {
            return false;
          }
        }
      )
    ]);

    // Get the OpenPay instance from the window object
    const openPay = window["OpenPay"];

    if (!openPay)
      return Promise.reject(
        new DetailedError(
          "OpenPay not found.",
          responseCodes.Not_Found,
          ErrorOrigin.Headless
        )
      );

    openPay.setId(settings[OPENPAY_FIELDS.MERCHANT_ID]);
    openPay.setApiKey(settings[OPENPAY_FIELDS.PUBLIC_KEY]);
    openPay.setSandboxMode(settings[OPENPAY_FIELDS.TEST_MODE] == 1);

    return { openPay, ...config };
  });
}

/**
 * @name getPaymentData
 * @desc Here we create a new payment detail via the Card SDK, and return
 * the payment detail ID which we later relay to the BE (when executing
 * payment). We do not need to pass a client secret for flow, as the
 * payment detail is attached to a customer and confirmed server-side.
 */
async function pay({ gateway, openPay, model }: OpenPayContext) {
  if (!openPay)
    return Promise.reject(
      new DetailedError(
        "OpenPay instance not found.",
        responseCodes.Not_Found,
        ErrorOrigin.Headless
      )
    );

  return new Promise((resolve, reject) => {
    openPay.token.create(
      model?.openpay as Record<string, any>,
      response =>
        resolve({
          /* Here we don't pass 'autoPayment' flag as 'storeOnPaymentAutoPayment' is injected from parent gatewayComponent */
          gateway_id: gateway?.id,
          payment_method_addition: {
            payment_method_id: response.data?.id
          },
          ...omit(
            model,
            ["openpay"] /* we don't need to send the card details again */
          )
        }),
      response =>
        reject(
          new DetailedError(
            response?.data?.description || response?.message,
            response.status ?? responseCodes.Unprocessable_Entity,
            ErrorOrigin.External
          )
        )
    );
  });
}

// -----------------------------------------------------------------------------

export default {
  ...sharedServices,
  // ---
  load,
  pay
};
