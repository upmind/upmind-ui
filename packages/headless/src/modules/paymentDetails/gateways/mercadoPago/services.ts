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
          debugger;
          // resolve();
          return Promise.resolve();
        },
        onSubmit: () => {
          debugger;
          return Promise.resolve(); // Do nothing as we handle submit separately
        },
        onError: error => {
          debugger;
          reject(error);
        },
        onBinChange: (bin: string) => {
          debugger;
          // You can use the bin to display information to the user
        }
      }
    }
  );

  const validationHelper = (callback: any, onReceiveEvent: any) => {
    const cb = (event?: any) => {
      callback({ type: "VALIDATE", data: { valid: !!event } });
    };

    // Instead of using `instance` event listeners, trigger the callback directly from the MercadoPago controller callbacks.
    // You can call `callback` in the `onReady`, `onSubmit`, or other relevant controller callbacks above.
    // For example, you might want to call the callback when the form is ready or when the BIN changes.
    // Here, we just provide a no-op cleanup function since event listeners are not used.
    return () => {};
  };

  // IIFE
  // await new Promise<void>(() =>
  //   (async (bricksBuilder: bricks.Bricks) => {
  //     sdk.mercadoPagoController = await bricksBuilder.create(
  //       "cardPayment",
  //       data?.container.id,
  //       {
  //         initialization: {
  //           amount,
  //           payer: {
  //             email: client.email,
  //             firstName: client.firstname,
  //             lastName: client.lastname,
  //             customerId: client.id
  //           }
  //         },
  //         customization: {
  //           visual: {
  //             hideFormTitle: true,
  //             hidePaymentButton: true,
  //             style: {
  //               theme: "default",
  //               customVariables: {
  //                 formPadding: "0rem",
  //                 formBackgroundColor: "transparent"
  //               }
  //             }
  //           },
  //           paymentMethods: {
  //             creditCard: "all",
  //             debitCard: "all",
  //             maxInstallments: 1
  //           }
  //         },
  //         callbacks: {
  //           onReady: () => {
  //             debugger;
  //             // resolve();
  //             return Promise.resolve();
  //           },
  //           onSubmit: () => {
  //             debugger;
  //             return Promise.resolve(); // Do nothing as we handle submit separately
  //           },
  //           onError: error => {
  //             debugger;
  //             reject(error);
  //           },
  //           onBinChange: (bin: string) => {
  //             debugger;
  //             // You can use the bin to display information to the user
  //           }
  //         }
  //       }
  //     );
  //   })(bricksBuilder)
  // );

  // we dont have an render functions for MercadoPago Card so just return the necessary data
  return {
    sdk,
    container: data?.container,
    validationHelper
  };
}

async function validate(context: MercadoPagoContext, _event: AnyEventObject) {
  const { t } = useI18n();

  return sharedServices.parse(context, _event).then(async (model: any) =>
    context.sdk?.mercadoPagoController?.getFormData().then(cardFormData => {
      debugger;
      if (isNil(cardFormData)) {
        debugger;
        throw new DetailedError(
          t("error.payment_gateway_validation_failed"),
          responseCodes.Unprocessable_Entity,
          ErrorOrigin.Headless
        );
      }
      debugger;
      return model;
    })
  );
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

  return sdk.mercadoPagoController?.getFormData().then(cardFormData => {
    debugger;
    if (!cardFormData)
      throw new DetailedError(
        t("error.payment_gateway_validation_failed"),
        responseCodes.Not_Found,
        ErrorOrigin.Headless
      );

    debugger;
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
  validate,
  pay
};
