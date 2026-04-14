// --- external
import type {
  DefaultValuesOption,
  StripeElementLocale,
  StripeElements
} from "@stripe/stripe-js";

// --- internal
import { useI18n, useLocale } from "../../..";
import sharedServices from "../services";
import { beginSetup } from "../services";

// --- utils
import {
  ErrorOrigin,
  DetailedError,
  responseCodes,
  useValidation
} from "../../../../utils";

import {
  getSupportedPaymentMethods,
  getPublicKey,
  parseMinorUnitAmount
} from "./utils";

import { get, set, some } from "lodash-es";

import {
  registerOperation,
  clearOperation,
  getOperationReturnUrl
} from "../../utils";

// --- types
import { GatewayContext as GatewayCtx } from "@upmind-automation/types";
import type { StripeContext } from "./types";
import type { AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------

async function load(context: StripeContext, _event: AnyEventObject) {
  const { gateway, amount, currency, address, ctx } = context;

  const { locale } = useLocale();

  const { t } = useI18n();

  if (!gateway)
    throw new DetailedError(
      t("error.payment_gateway_not_available"),
      responseCodes.Not_Found,
      ErrorOrigin.Headless
    );

  return sharedServices.load(context, _event).then(async config => {
    const key = getPublicKey(gateway);

    if (!key)
      throw new DetailedError(
        t("error.payment_gateway_not_available"),
        responseCodes.Not_Found,
        ErrorOrigin.Headless
      );

    return import("@stripe/stripe-js").then(({ loadStripe }) =>
      loadStripe(key).then(async stripe => {
        if (!stripe)
          throw new DetailedError(
            t("error.payment_gateway_not_available"),
            responseCodes.Not_Found,
            ErrorOrigin.Headless
          );

        // --- ADD context: call beginSetup first, init Elements with clientSecret
        if (ctx === GatewayCtx.ADD) {
          return beginSetup(context).then(setupResponse => {
            const clientSecret = get(
              setupResponse,
              "gateway_specific.client_secret"
            );
            const clientPaymentDetailsId = get(
              setupResponse,
              "client_payment_details.id"
            );

            if (!clientSecret || !clientPaymentDetailsId) {
              throw new DetailedError(
                t("error.payment_gateway_not_available"),
                responseCodes.Unprocessable_Entity,
                ErrorOrigin.Headless
              );
            }

            const elements: StripeElements = stripe.elements({
              clientSecret,
              locale: (locale.value.toLowerCase() ??
                "auto") as StripeElementLocale
            });

            const element = elements.create("payment");

            return {
              sdk: { stripe, elements, element },
              clientPaymentDetailsId,
              clientSecret,
              ...config
            };
          });
        }

        // --- PAY context: init Elements with mode: "payment" + amount
        // Flow ref: https://stripe.com/docs/payments/finalize-payments-on-the-server?platform=web&type=payment#additional-options
        const elements: StripeElements = stripe.elements({
          amount: parseMinorUnitAmount(amount || 0, currency.code),
          currency: currency.code.toLowerCase(), // NB: MUST be lowercase
          locale: (locale.value.toLowerCase() ?? "auto") as StripeElementLocale,
          mode: "payment",
          paymentMethodCreation: "manual",
          paymentMethodTypes: getSupportedPaymentMethods(
            gateway,
            currency.code
          ),
          setupFutureUsage: "off_session"
        });

        const element = elements.create("payment", {
          defaultValues: {
            billingDetails: {
              address: {
                country: address?.country?.code,
                postal_code: address?.postcode,
                state: address?.state,
                city: address?.city,
                line1: address?.address_1,
                line2: address?.address_2
              }
            }
          } as DefaultValuesOption
        });

        return { sdk: { stripe, elements, element }, ...config };
      })
    );
  });
}

async function render({ sdk }: StripeContext, { data }: AnyEventObject) {
  const { t } = useI18n();

  if (!sdk?.element || !data?.container) {
    throw new DetailedError(
      t("error.payment_gateway_not_available"),
      responseCodes.Not_Found,
      ErrorOrigin.Headless,
      { element: sdk?.element, container: data?.container }
    );
  }
  const container = data.container as HTMLElement;

  const validationHelper = (callback: any, _onReceiveEvent: AnyEventObject) => {
    (sdk.element as any)!.on("change", (event: any) => {
      callback({ type: "VALIDATE", data: event });
    });

    return () => {};
  };

  return new Promise((resolve, reject) => {
    sdk.element!.mount(container);
    sdk.element.once("ready", () => {
      resolve({ sdk, container, validationHelper });
    });
    sdk.element.once("loaderror", ({ error }) => {
      reject(
        new DetailedError(
          error?.message ?? t("error.payment_gateway_not_available"),
          responseCodes.Bad_Request,
          ErrorOrigin.External,
          error
        )
      );
    });
  });
}

async function validate(
  { schema, model, sdk, error }: StripeContext,
  _event: AnyEventObject
) {
  const { t } = useI18n();

  // Get any errors from the Stripe Element
  if (!sdk?.element) {
    throw new DetailedError(
      t("error.payment_gateway_not_available"),
      responseCodes.Not_Found,
      ErrorOrigin.Headless
    );
  }

  // Now validate the model as per normal
  const { validate } = useValidation();

  if (!schema) return model;

  const errors = validate(schema, model) || [];

  // NB: our SDK helper for stripe will generate their own errors and persist them to our error context
  //     so we can check against that as well
  if (
    errors?.length ||
    some(error?.data, ["instancePath", "/payment_method_addition"])
  ) {
    throw new DetailedError(
      t("error.payment_gateway_validation_failed"),
      responseCodes.Unprocessable_Entity,
      ErrorOrigin.Headless,
      [...errors, ...error?.data]
    );
  }

  return model;
}

/**
 * @name pay
 * @desc Here we create a new payment detail via the Stripe SDK, and return
 * the payment detail ID which we later relay to the BE (when executing
 * payment). We do not need to pass a client secret for flow, as the
 * payment detail is attached to a customer and confirmed server-side.
 */
async function pay({ sdk, model }: StripeContext) {
  const { t } = useI18n();

  if (!sdk?.stripe || !sdk?.element || !sdk?.elements)
    throw new DetailedError(
      t("error.payment_gateway_not_available"),
      responseCodes.Not_Found,
      ErrorOrigin.Headless
    );

  // Submit form to validate fields
  return (
    sdk.elements
      .submit()
      // Check for any errors when submitting the element
      .then(({ error }) => {
        if (error)
          throw new DetailedError(
            error.message ?? t("error.payment_gateway_update_failed"),
            responseCodes.Unprocessable_Entity,
            ErrorOrigin.External,
            error
          );
      })
      // Create PaymentMethod using details collected via Payment Element
      .then(() =>
        sdk.stripe
          .createPaymentMethod({
            elements: sdk.elements
          })
          .then(({ error, paymentMethod }) => {
            if (error)
              throw new DetailedError(
                error.message ?? t("error.payment_gateway_update_failed"),
                responseCodes.Unprocessable_Entity,
                ErrorOrigin.External,
                error
              );

            set(
              model!,
              "payment_method_addition.payment_method_id",
              paymentMethod?.id
            );
            set(
              model!,
              "payment_method_addition.payment_method_type",
              paymentMethod?.type
            );

            return model;
          })
      )
  );
}

/**
 * @name add
 * @desc Confirm the setup of a new payment detail via the Stripe SDK.
 * Uses stripe.confirmSetup() with the Elements instance initialised with
 * the clientSecret obtained during load (ADD context).
 * On success, calls endSetup to finalise storing the payment method.
 */
async function add(context: StripeContext) {
  const { sdk, model, clientPaymentDetailsId, gateway } = context;
  const { t } = useI18n();

  if (!sdk?.stripe || !sdk?.elements || !clientPaymentDetailsId || !gateway?.id)
    throw new DetailedError(
      t("error.payment_gateway_not_available"),
      responseCodes.Not_Found,
      ErrorOrigin.Headless
    );

  // --- Build operation data
  const operationData = {
    gatewayId: gateway.id,
    data: {
      client_payment_details_id: clientPaymentDetailsId,
      auto_payment: model?.store_on_payment_auto_payment ?? false
    }
  };

  // --- Persist operation for off-site redirect recovery
  registerOperation(operationData);

  // Confirm setup — may redirect off-site for 3DS/SCA
  return sdk.stripe
    .confirmSetup({
      elements: sdk.elements,
      redirect: "if_required",
      confirmParams: {
        return_url: getOperationReturnUrl()
      }
    })
    .then(({ error: confirmError, setupIntent }) => {
      // Clean up on inline completion (no redirect)
      clearOperation();

      if (confirmError)
        throw new DetailedError(
          confirmError.message ?? t("error.payment_gateway_update_failed"),
          responseCodes.Unprocessable_Entity,
          ErrorOrigin.External,
          confirmError
        );

      // Return operation data with token — paymentDetail finalizing will call endSetup
      return {
        ...operationData,
        data: {
          ...operationData.data,
          token: setupIntent?.payment_method as string
        }
      };
    });
}

// -----------------------------------------------------------------------------

export default {
  load,
  render,
  parse: sharedServices.parse,
  validate,
  // ---
  pay,
  add
};
