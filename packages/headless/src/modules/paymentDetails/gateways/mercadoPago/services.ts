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
import { MERCADOPAGO_FIELDS, MercadoPagoContext } from "./types";
import type { AnyEventObject } from "xstate";

// --- utils
import { isNil, omit } from "lodash-es";

// --- types
import type { GatewayContext } from "../types";
import { parseSettings } from "../utils";

// -----------------------------------------------------------------------------

async function load(context: MercadoPagoContext, _event: AnyEventObject) {
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

    // load in our MercadoPago scripts
    await Promise.all([
      useScripts().load(
        "mercadoPago_v1",
        "https://js.mercadopago.mx/mercadopago.v1.min.js",
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
        "mercadoPagoData_v1",
        "https://js.mercadopago.mx/mercadopago-data.v1.min.js",
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

    // Get the MercadoPago instance from the window object
    const mercadoPago = window["MercadoPago"];

    if (!mercadoPago)
      throw new DetailedError(
        t("error.payment_gateway_not_available"),
        responseCodes.Not_Found,
        ErrorOrigin.Headless
      );

    mercadoPago.setId(settings[MERCADOPAGO_FIELDS.MERCHANT_ID]);
    mercadoPago.setApiKey(settings[MERCADOPAGO_FIELDS.PUBLIC_KEY]);
    mercadoPago.setSandboxMode(settings[MERCADOPAGO_FIELDS.TEST_MODE] == 1);
    return { sdk: { mercadoPago }, ...config };
  });
}

async function render({ sdk }: MercadoPagoContext, { data }: AnyEventObject) {
  const { t } = useI18n();

  if (!sdk?.mercadoPago) {
    throw new DetailedError(
      t("error.payment_gateway_not_available"),
      responseCodes.Not_Found,
      ErrorOrigin.Headless,
      { sdk, container: data?.container }
    );
  }

  // we dont have an render functions for MercadoPago Card so just return the necessary data
  return { sdk, container: null, validationHelper: null };
}

async function validate(context: MercadoPagoContext, _event: AnyEventObject) {
  const { t } = useI18n();

  return sharedServices.parse(context, _event).then((model: any) => {
    // additional parsing for MercadoPago
    //  we need to check the expiry date is greater than the current date MM/YY, we dont need to check time
    // our previous validation will have checked the format/requirements are correct
    // and we will only get to this point if there are no other errors
    if (!isNil(model?.mercadopago?.expiration_date)) {
      let year =
        model?.mercadopago.expiration_date.match(/^\d{2}\/(\d{2})$/)?.[1] || "";
      // MercadoPago requires the month to be in 2 digit format, which we parse from the MM/YY format
      const month =
        model?.mercadopago.expiration_date.match(/^(\d{2})\/\d{2}$/)?.[1] || "";

      const now = new Date();

      // If the current year is in the last decade of the century (e.g., 1990-1999),
      // and the provided 2-digit year is less than (current year - 20), we assume the card expiry is in the next century.
      // This handles the common case where cards have a 2-digit expiry year and ensures that cards expiring
      const currentFullYear = now.getFullYear();
      const currentCentury = currentFullYear - (currentFullYear % 100);
      const currentYearInCentury = currentFullYear % 100;
      let fullYear = currentCentury + parseInt(year, 10);
      if (currentYearInCentury >= 90 && fullYear < currentFullYear - 20) {
        fullYear += 100;
      }
      year = fullYear.toString();

      // set the date to the first of the month
      // this means that if a card expires in the current month, it is still valid until the end of the month
      const expiry = new Date(year, month, 1);

      if (expiry <= now) {
        throw new DetailedError(
          t("error.payment_gateway_validation_failed"),
          responseCodes.Unprocessable_Entity,
          ErrorOrigin.Headless,
          [
            {
              instancePath: "/mercadopago/expiration_date",
              schemaPath: "/properties/mercadopago/properties/expiration_date",
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
async function pay({ gateway, sdk, model }: MercadoPagoContext) {
  const { t } = useI18n();

  if (!sdk?.mercadoPago)
    return Promise.reject(
      new DetailedError(
        t("error.payment_gateway_not_available"),
        responseCodes.Not_Found,
        ErrorOrigin.Headless
      )
    );

  return new Promise((resolve, reject) => {
    const data = {
      card_number: model?.mercadopago.card_number,
      holder_name: model?.mercadopago.holder_name,
      // MercadoPago requires the year to be in 2 digit format which we parse from the MM/YY format
      expiration_year:
        model?.mercadopago.expiration_date.match(/^\d{2}\/(\d{2})$/)?.[1] || "",
      // MercadoPago requires the month to be in 2 digit format, which we parse from the MM/YY format
      expiration_month:
        model?.mercadopago.expiration_date.match(/^(\d{2})\/\d{2}$/)?.[1] || "",
      cvv2: model?.mercadopago.cvv2
    };
    sdk.mercadoPago!.token.create(
      data as Record<string, any>,
      response =>
        resolve({
          ...omit(model, [
            "mercadopago"
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
