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
        "https://js.openpay.mx/openpay.v1.min.js"
      ),
      useScripts().load(
        "openPayData_v1",
        "https://js.openpay.mx/openpay-data.v1.min.js"
      )
    ]);

    // Get the OpenPay instance from the window object
    const openPay = window["OpenPay"];

    if (!openPay)
      return Promise.reject(
        new DetailedError(
          "Braintree Client Token not found.",
          responseCodes.Not_Found,
          ErrorOrigin.Headless
        )
      );

    openPay.setId(settings[OPENPAY_FIELDS.MERCHANT_ID]);
    openPay.setApiKey(settings[OPENPAY_FIELDS.PUBLIC_KEY]);
    openPay.setSandboxMode(settings[OPENPAY_FIELDS.TEST_MODE] === "1");

    return { openPay, ...config };
  });
}

// async function parse(context: OpenPayContext, _event: AnyEventObject) {
//   return sharedServices.parse(context, _event).then(model => {
//     //additional parsing required for openpay
//     return {
//       ...model,
//       card_number: model.form.card_num.replace(/\s/g, ""),
//       expiration_year:
//         model.form.card_expire_date.match(/^\d{2}\/\d{2}(\d{2})$/)?.[1] || "",
//       expiration_month:
//         model.form.card_expire_date.match(/^(\d{2})\/\d{4}$/)?.[1] || ""
//     } as OpenPayModel;
//   });
// }

/**
 * @name getPaymentData
 * @desc Here we create a new payment detail via the Card SDK, and return
 * the payment detail ID which we later relay to the BE (when executing
 * payment). We do not need to pass a client secret for flow, as the
 * payment detail is attached to a customer and confirmed server-side.
 */
async function pay({ gateway, OpenPay, model }: OpenPayContext) {
  if (!OpenPay)
    return Promise.reject(
      new DetailedError(
        "OpenPay instance not found.",
        responseCodes.Not_Found,
        ErrorOrigin.Headless
      )
    );

  return new Promise((resolve, reject) => {
    OpenPay.token.create(
      model as Record<string, any>,
      response =>
        resolve({
          /* Here we don't pass 'auto_payment' flag as 'store_on_payment_auto_payment' is injected from parent gatewayComponent */
          gateway_id: gateway?.id,
          payment_method_addition: {
            payment_method_id: response.data?.id
          }
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
