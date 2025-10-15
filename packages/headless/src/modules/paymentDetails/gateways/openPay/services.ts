// --- external

// --- internal
import { useI18n } from "../../..";
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
import { isNil, omit } from "lodash-es";

// --- types
import type { GatewayContext } from "../types";
import { parseSettings } from "../utils";

// -----------------------------------------------------------------------------

async function load(context: OpenPayContext, _event: AnyEventObject) {
  //  first get our default load config
  const { gateway, currency } = context;
  const { t } = useI18n();

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
      throw new DetailedError(
        t("error.payment_gateway_not_available"),
        responseCodes.Not_Found,
        ErrorOrigin.Headless
      );

    openPay.setId(settings[OPENPAY_FIELDS.MERCHANT_ID]);
    openPay.setApiKey(settings[OPENPAY_FIELDS.PUBLIC_KEY]);
    openPay.setSandboxMode(settings[OPENPAY_FIELDS.TEST_MODE] == 1);
    return { sdk: { openPay }, ...config };
  });
}

async function render({ sdk }: OpenPayContext, { data }: AnyEventObject) {
  const { t } = useI18n();

  if (!sdk?.openPay) {
    throw new DetailedError(
      t("error.payment_gateway_not_available"),
      responseCodes.Not_Found,
      ErrorOrigin.Headless,
      { sdk, container: data?.container }
    );
  }

  // we dont have an render functions for OpenPay Card so just return the necessary data
  return { sdk, container: null, validationHelper: null };
}

async function validate(context: OpenPayContext, _event: AnyEventObject) {
  const { t } = useI18n();

  return sharedServices.parse(context, _event).then((model: any) => {
    // additional parsing for OpenPay
    //  we need to check the expiry date is greater than the current date MM/YY, we dont need to check time
    // our previous validation will have checked the format/requirements are correct
    // and we will only get to this point if there are no other errors
    if (!isNil(model?.openpay?.expiration_date)) {
      let year =
        model?.openpay.expiration_date.match(/^\d{2}\/(\d{2})$/)?.[1] || "";
      // OpenPay requires the month to be in 2 digit format, which we parse from the MM/YY format
      const month =
        model?.openpay.expiration_date.match(/^(\d{2})\/\d{2}$/)?.[1] || "";

      debugger;
      const now = new Date();

      // Stripe-like logic: convert 2-digit year to 4-digit year in current century, unless >20 years in the past, then add 100 years
      const currentFullYear = now.getFullYear();
      const currentCentury = currentFullYear - (currentFullYear % 100);
      let fullYear = currentCentury + parseInt(year, 10);
      if (fullYear < currentFullYear - 20) {
        fullYear += 100;
      }
      year = fullYear.toString();

      // set the date to the first of the month at midnight
      // this means that if a card expires in the current month, it is still valid until the end of the month
      // e.g. if today is 15/06/2023, a card expiring 06/23 is valid until 30/06/2023 23:59
      const expiry = new Date(Date.parse(`01/${month}/${year}`)); // parse to first of month at midnight

      debugger;
      if (expiry <= now) {
        debugger;
        throw new DetailedError(
          t("error.payment_gateway_validation_failed"),
          responseCodes.Unprocessable_Entity,
          ErrorOrigin.Headless,
          [
            {
              instancePath: "/openpay/expiration_date",
              schemaPath: "/properties/openpay/properties/expiration_date",
              keyword: "format",
              params: {},
              message: t("form.card_expiry.error")
            }
          ]
        );
      }
    }

    return context.model;
  });
}

/**
 * @name getPaymentData
 * @desc Here we create a new payment detail via the Card SDK, and return
 * the payment detail ID which we later relay to the BE (when executing
 * payment). We do not need to pass a client secret for flow, as the
 * payment detail is attached to a customer and confirmed server-side.
 */
async function pay({ gateway, sdk, model }: OpenPayContext) {
  const { t } = useI18n();

  if (!sdk?.openPay)
    return Promise.reject(
      new DetailedError(
        t("error.payment_gateway_not_available"),
        responseCodes.Not_Found,
        ErrorOrigin.Headless
      )
    );

  return new Promise((resolve, reject) => {
    const data = {
      card_number: model?.openpay.card_number,
      holder_name: model?.openpay.holder_name,
      // OpenPay requires the year to be in 2 digit format which we parse from the MM/YY format
      expiration_year:
        model?.openpay.expiration_date.match(/^\d{2}\/(\d{2})$/)?.[1] || "",
      // OpenPay requires the month to be in 2 digit format, which we parse from the MM/YY format
      expiration_month:
        model?.openpay.expiration_date.match(/^(\d{2})\/\d{2}$/)?.[1] || "",
      cvv2: model?.openpay.cvv2
    };
    sdk.openPay!.token.create(
      data as Record<string, any>,
      response =>
        resolve({
          ...omit(model, [
            "openpay"
          ]) /* we don't need to send the card details again */,
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
  render,
  validate,
  pay
};
