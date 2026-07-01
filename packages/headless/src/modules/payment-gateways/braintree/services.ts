// --- external
// BraintreeDropin is dynamically imported in render() for lazy loading

import { useI18n, useLocale } from "../../system-localisation";
import { useQuery } from "../../query";
import sharedServices from "../payment-gateways.services";
import { beginSetup } from "../payment-gateways.services";
import { parseSettings } from "../payment-gateways.utils";
import {
  type BraintreeResponse,
  BraintreeTypes,
  type BraintreeContext
} from "./types";
import {
  ErrorOrigin,
  DetailedError,
  responseCodes,
  useValidation
} from "../../../utils";
import { defaultsDeep, get, pick, set, some } from "lodash-es";
import type {
  Dropin,
  PaymentMethodOptions,
  paypalCreateOptions,
  PaymentMethodPayload,
  PaymentMethodRequestablePayload
} from "braintree-web-drop-in";
import type { AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------

async function load(context: BraintreeContext, _event: AnyEventObject) {
  const { gateway, currency } = context;

  const { t } = useI18n();

  return sharedServices.load(context, _event).then(async config => {
    const { get: getRequest, useUrl } = useQuery();

    const authorization = await getRequest<BraintreeResponse>({
      url: useUrl(`gateway/frontend/${gateway.id}`, {
        currency: currency.code
      }),
      queryKey: ["gateway", "frontend", gateway.id],
      withAccessToken: true,
      staleTime: 0, // disable cache, this may still return stale data while the request is in flight
      gcTime: 0 // force cache to be cleared immediately, to prevent stale data
    }).then(response => response.gateway_specific.clientToken);

    const settings = pick(parseSettings(gateway), [
      "paymentUses3DS",
      "paymentMethodPayPal"
    ]);

    if (!authorization) {
      throw new DetailedError(
        t("error.payment_gateway_not_available"),
        responseCodes.Not_Found,
        ErrorOrigin.Headless
      );
    }

    return { sdk: { authorization }, ...config, ...settings };
  });
}

async function render(
  {
    sdk,
    amount,
    currency,
    paymentUses3DS,
    paymentMethodPayPal
  }: BraintreeContext,
  { data }: AnyEventObject
) {
  const { locale } = useLocale();
  const { t } = useI18n();

  const container = data?.container as HTMLElement;

  const paypal: paypalCreateOptions = defaultsDeep(data?.paypal ?? {}, {
    flow: "vault",
    amount,
    currency: currency.code.toLowerCase(),
    buttonStyle: {
      color: "gold",
      shape: "rect",
      size: "medium"
    }
  });

  if (!sdk?.authorization || !container) {
    throw new DetailedError(
      t("error.payment_gateway_not_available"),
      responseCodes.Not_Found,
      ErrorOrigin.Headless,
      {
        authorization: sdk?.authorization,
        container
      }
    );
  }

  // Lazy import: braintree-web-drop-in is a heavy external SDK — code-split it
  // out of the main bundle and only fetch it when a Braintree gateway renders.
  const BraintreeDropin = await import("braintree-web-drop-in");

  return BraintreeDropin.default
    .create({
      authorization: sdk.authorization,
      container,
      locale: locale.value,
      ...(paymentUses3DS ? { threeDSecure: true } : {}),
      ...(paymentMethodPayPal ? { paypal } : {})
    })
    .then((instance: Dropin) => {
      // set up our callback helper to watch for validation
      const validationHelper = (callback: any, _onReceiveEvent: any) => {
        const cb = (event?: PaymentMethodRequestablePayload) => {
          callback({ type: "VALIDATE", data: { valid: !!event } });
        };

        instance.on("paymentMethodRequestable", cb);
        instance.on("noPaymentMethodRequestable", cb);

        return () => {
          instance.off("paymentMethodRequestable", cb);
          instance.off("noPaymentMethodRequestable", cb);
        };
      };

      return {
        // NB: if we return the entire instance, we run into issue with our xstate inspector....
        //     So we only pull the methods we need.
        sdk: {
          authorization: sdk.authorization,
          braintree: {
            clearSelectedPaymentMethod:
              instance.clearSelectedPaymentMethod.bind(instance),
            isPaymentMethodRequestable:
              instance.isPaymentMethodRequestable.bind(instance),
            requestPaymentMethod: instance.requestPaymentMethod.bind(instance),
            teardown: instance.teardown.bind(instance),
            updateConfiguration: instance.updateConfiguration.bind(instance)
          } as Dropin
        },
        container,
        validationHelper
      };
    });
}

async function validate(
  { schema, model, sdk, error }: BraintreeContext,
  _event: AnyEventObject
) {
  const { t } = useI18n();

  // Get any errors from the Braintree Instance

  if (!sdk?.braintree) {
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
      { ...errors, ...error?.data }
    );
  }

  return model;
}

/**
 * @name pay
 * @desc Here we create a new payment detail via the Braintree SDK, and return
 * the payment detail NONCE which we later relay to the BE (when executing
 * payment). We do not need to pass a client secret for flow, as the
 * payment detail is attached to a customer and confirmed server-side.
 */
async function pay({ model, sdk, amount, paymentUses3DS }: BraintreeContext) {
  const { t } = useI18n();

  if (!sdk?.braintree || !sdk?.authorization) {
    throw new DetailedError(
      t("error.braintree_instance_not_found"),
      responseCodes.Not_Found,
      ErrorOrigin.Headless
    );
  }

  const paymentOptions = (
    paymentUses3DS ? { threeDSecure: { amount: amount?.toString() } } : {}
  ) as PaymentMethodOptions;

  return sdk?.braintree
    .requestPaymentMethod(paymentOptions)
    .then((payload: PaymentMethodPayload) => {
      const isCard = payload.type === BraintreeTypes.CARD;

      // additional checks for any 3D Secure challenges
      if (isCard && paymentUses3DS && !payload.liabilityShifted) {
        sdk?.braintree?.clearSelectedPaymentMethod();
        throw new DetailedError(
          "3D Secure challenge failed.",
          responseCodes.Unprocessable_Entity,
          ErrorOrigin.External
        );
      }

      // add the payment details to the model
      set(
        model!,
        "payment_method_addition.payment_method_nonce",
        payload.nonce
      );

      return model;
    });
}

/**
 * @name add
 * @desc Stores a payment method via Braintree in the ADD context.
 * Calls beginSetup → SDK requestPaymentMethod (nonce) → endSetup.
 */
async function add(context: BraintreeContext) {
  const { sdk, model, paymentUses3DS, amount } = context;
  const { t } = useI18n();

  if (!sdk?.braintree || !sdk?.authorization) {
    throw new DetailedError(
      t("error.braintree_instance_not_found"),
      responseCodes.Not_Found,
      ErrorOrigin.Headless
    );
  }

  const setupResponse = await beginSetup(context);
  const clientPaymentDetailsId = get(
    setupResponse,
    "client_payment_details.id"
  );

  if (!clientPaymentDetailsId) {
    throw new DetailedError(
      t("error.payment_gateway_not_available"),
      responseCodes.Unprocessable_Entity,
      ErrorOrigin.Headless
    );
  }

  const paymentOptions = (
    paymentUses3DS ? { threeDSecure: { amount: amount?.toString() } } : {}
  ) as PaymentMethodOptions;

  return sdk.braintree
    .requestPaymentMethod(paymentOptions)
    .then((payload: PaymentMethodPayload) => {
      const isCard = payload.type === BraintreeTypes.CARD;

      if (isCard && paymentUses3DS && !payload.liabilityShifted) {
        sdk.braintree?.clearSelectedPaymentMethod();
        throw new DetailedError(
          "3D Secure challenge failed.",
          responseCodes.Unprocessable_Entity,
          ErrorOrigin.External
        );
      }

      return {
        gatewayId: context.gateway?.id,
        data: {
          client_payment_details_id: clientPaymentDetailsId,
          auto_payment: model?.store_on_payment_auto_payment ?? false,
          payment_method_nonce: payload.nonce
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
