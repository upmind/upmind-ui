/// <reference types="@types/mercadopago-sdk-js" />
// --- external

// --- internal
import { useI18n, useLocale } from "../../..";
import sharedServices from "../services";

// --- utils
import {
  ErrorOrigin,
  DetailedError,
  responseCodes,
  useScripts
} from "../../../../utils";

// --- types
import { MERCADOPAGO_FIELDS, type MercadoPagoContext } from "./types";
import type { AnyEventObject } from "xstate";

// --- utils

// --- types
import type { GatewayContext } from "../types";
import { parseSettings } from "../utils";

// -----------------------------------------------------------------------------

async function load(context: MercadoPagoContext, _event: AnyEventObject) {
  //  first get our default load config
  const { gateway } = context;
  const { locale } = useLocale();
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
        "mercadoPago_v2",
        "https://sdk.mercadopago.com/js/v2",
        {}
      )
    ]);

    // Get the MercadoPago instance from the window object
    const MercadoPago = window["MercadoPago"];

    if (!MercadoPago)
      throw new DetailedError(
        t("error.payment_gateway_not_available"),
        responseCodes.Not_Found,
        ErrorOrigin.Headless
      );

    const mercadoPago = new MercadoPago(
      settings[MERCADOPAGO_FIELDS.PUBLIC_KEY],
      {
        locale: locale.value as mercadopagocore.Locale
      }
    );

    return { sdk: { mercadoPago }, ...config };
  });
}

async function render(
  { sdk, amount, client }: MercadoPagoContext,
  { data }: AnyEventObject
) {
  const { t } = useI18n();

  if (!sdk?.mercadoPago) {
    throw new DetailedError(
      t("error.payment_gateway_not_available"),
      responseCodes.Not_Found,
      ErrorOrigin.Headless,
      { sdk, container: data?.container }
    );
  }

  const bricksBuilder = sdk.mercadoPago.bricks();
  // IIFE;
  await new Promise<void>((resolve, reject) =>
    (async (bricksBuilder: bricks.Bricks) => {
      sdk.mercadoPagoController = await bricksBuilder.create(
        "cardPayment",
        data?.container.id,
        {
          initialization: {
            amount,
            payer: {
              email: client.email,
              firstName: client.firstname,
              lastName: client.lastname,
              customerId: client.id
            }
          },
          customization: {
            visual: {
              hideFormTitle: true,
              hidePaymentButton: true,
              style: {
                theme: "default",
                customVariables: {
                  formPadding: "0rem",
                  formBackgroundColor: "transparent"
                }
              }
            },
            paymentMethods: {
              creditCard: "all",
              debitCard: "all",
              maxInstallments: 1
            }
          },
          callbacks: {
            onReady: () => {
              resolve();
            },
            onSubmit: () => {
              return Promise.resolve(); // Do nothing as we handle submit separately
            },
            onError: (error: bricks.BrickError) => {
              reject(error);
            }
          }
        }
      );
    })(bricksBuilder)
  );

  // we dont have an render functions for MercadoPago Card so just return the necessary data
  return {
    sdk,
    container: data?.container
  };
}

/**
 * @name getPaymentData
 * @desc Here we create a new payment detail via the Card SDK, and return
 * the payment detail ID which we later relay to the BE (when executing
 * payment). We do not need to pass a client secret for flow, as the
 * payment detail is attached to a customer and confirmed server-side.
 */
async function pay({ gateway, sdk }: MercadoPagoContext) {
  const { t } = useI18n();

  if (!sdk?.mercadoPago)
    throw new DetailedError(
      t("error.payment_gateway_not_available"),
      responseCodes.Not_Found,
      ErrorOrigin.Headless
    );

  return sdk.mercadoPagoController
    ?.getFormData()
    .then((cardFormData: bricks.FormData<"cardPayment"> | undefined) => {
      if (!cardFormData)
        throw new DetailedError(
          t("error.payment_gateway_validation_failed"),
          responseCodes.Not_Found,
          ErrorOrigin.Headless
        );

      return {
        gateway_id: gateway?.id,
        payment_method_addition: {
          payment_method_id: cardFormData.payment_method_id,
          token: cardFormData.token
        }
      };
    });
}

// -----------------------------------------------------------------------------

export default {
  ...sharedServices,
  // ---
  load,
  render,
  pay
};
