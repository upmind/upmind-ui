// --- external
import {
  DefaultValuesOption,
  loadStripe,
  StripeElementLocale,
  StripeElements
} from "@stripe/stripe-js";

// --- internal
import { useI18n, useLocale } from "../../..";
import sharedServices from "../services";

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

import { set } from "lodash-es";

// --- types
import type { StripeContext } from "./types";
import type { AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------

async function load(context: StripeContext, _event: AnyEventObject) {
  const { gateway, amount, currency, address } = context;

  const { t } = useI18n();
  const options = await sharedServices.load(context, _event);

  if (!gateway)
    return Promise.reject(
      new DetailedError(
        t("error.stripe_public_key_not_available"),
        responseCodes.Not_Found,
        ErrorOrigin.Headless
      )
    );

  if (!currency)
    return Promise.reject(
      new DetailedError(
        "Currency not found.",
        responseCodes.Not_Found,
        ErrorOrigin.Headless
      )
    );

  return sharedServices.load(context, _event).then(async config => {
    const key = getPublicKey(gateway);
    if (!key)
      return Promise.reject(
        new DetailedError(
          t("error.stripe_not_available"),
          responseCodes.Not_Found,
          ErrorOrigin.Headless
        )
      );

    return loadStripe(key).then(stripe => {
      if (!stripe)
        throw new DetailedError(
          "Stripe not found.",
          responseCodes.Not_Found,
          ErrorOrigin.Headless
        );

      const { locale } = useLocale();

      // Flow ref: https://stripe.com/docs/payments/finalize-payments-on-the-server?platform=web&type=payment#additional-options
      const elements: StripeElements = stripe.elements({
        amount: parseMinorUnitAmount(amount || 0, currency.code),
        currency: currency.code.toLowerCase(), // NB: MUST be lowercase
        locale: (locale.value.toLowerCase() ?? "auto") as StripeElementLocale,
        mode: "payment",
        paymentMethodCreation: "manual",
        paymentMethodTypes: getSupportedPaymentMethods(gateway, currency.code),
        setupFutureUsage: "off_session"
      });

      const element = elements.create("payment", {
        defaultValues: {
          billingDetails: {
            // name: client.name,
            // email: client.email,
            // phone: client.phone,
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

      return { stripe, elements, element, ...config };
    });
  });
}

async function validate(
  { schema, model, element }: StripeContext,
  { data }: AnyEventObject
) {
  const { t } = useI18n();

  // Get any errors from the Stripe Element
  if (!element)
    return Promise.reject(
      new DetailedError(
        t("error.stripe_element_not_available"),
        responseCodes.Not_Found,
        ErrorOrigin.Headless
      )
    );

  // Now validate the model as per normal
  const { validate } = useValidation();

  return new Promise((resolve, reject) => {
    if (!schema) return resolve(model);

    const errors = validate(schema, model) || [];

    // NB: we are invalid if the stripe element status is NOT complete!
    if (!data?.complete) {
      errors.push({
        instancePath: "/payment_method_addition",
        schemaPath: "#/properties/payment_method_addition",
        keyword: "required",
        params: {
          missingProperty: "payment_method_addition"
        },
        message: "Stripe element is incomplete."
      });
    }

    if (errors?.length) {
      reject(
        new DetailedError(
          t("error.stripe_validation_failed"),
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

async function render({ element }: StripeContext, { data }: AnyEventObject) {
  return new Promise((resolve, reject) => {
    if (!element || !data?.container) {
      reject(
        new DetailedError(
          "Cannot render Stripe Element. Missing element or container.",
          responseCodes.Not_Found,
          ErrorOrigin.Headless,
          { element, container: data?.container }
        )
      );
    }
    const container = data.container as HTMLElement;

    element!.mount(container);

    const validationHelper = (
      callback: any,
      _onReceiveEvent: AnyEventObject
    ) => {
      (element as any)!.on("change", (event: any) => {
        callback({ type: "VALIDATE", data: event });
      });

      return () => {};
    };

    // once we successfully render we can 'clear; our renderer to prevent any further attempts
    return resolve({ container, validationHelper });
  });
}

/**
 * @name pay
 * @desc Here we create a new payment detail via the Stripe SDK, and return
 * the payment detail ID which we later relay to the BE (when executing
 * payment). We do not need to pass a client secret for flow, as the
 * payment detail is attached to a customer and confirmed server-side.
 */
async function pay({ elements, stripe, model }: StripeContext) {
  const { t } = useI18n();

  if (!elements || !stripe)
    return Promise.reject(
      new DetailedError(
        t("error.stripe_element_not_available"),
        responseCodes.Not_Found,
        ErrorOrigin.Headless
      )
    );

  // Submit form to validate fields
  const { error: submitError } = await elements
    .submit()
    .catch((error: any) =>
      Promise.reject(
        new DetailedError(
          t("error.stripe_element_submission_failed"),
          responseCodes.Unprocessable_Entity,
          ErrorOrigin.Headless,
          error
        )
      )
    );

  if (submitError) return Promise.reject(submitError);

  // Create PaymentMethod using details collected via Payment Element
  const { error, paymentMethod } = await stripe
    .createPaymentMethod({
      elements
    })
    .catch((error: any) => Promise.reject(error));

  return new Promise((resolve, reject) => {
    if (error) {
      reject(
        new DetailedError(
          error.message ?? t("error.stripe_payment_method_create_failed"),
          responseCodes.Unprocessable_Entity,
          ErrorOrigin.Headless,
          error
        )
      );
    } else {
      // add the payment details to the model

      // NB pass the model amout  back as we have to handle non-minor unit conversion here
      // (e.g. UGX)
      // ↳ Stripe requires minor unit for the amount when creating the element,
      //   but we need to pass the standard unit amount to the BE when creating
      //   the payment intent (as BE handles conversion to minor unit)
      // set(
      //   model,
      //   "amount",
      //   parseMinorUnitAmount(model.amount || 0, model.currency.code)
      // );

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

      /* Here we don't pass 'store_on_payment_auto_payment' flag as 'store_on_payment_auto_payment' is injected from parent gatewayComponent */
      resolve(model);
    }
  });
}

// -----------------------------------------------------------------------------

export default {
  load,
  parse: sharedServices.parse,
  validate,
  render,
  // ---
  pay
};
