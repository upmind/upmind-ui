// --- external
import { loadStripe } from "@stripe/stripe-js";

// --- internal
import { useQuery, useSession } from "../../..";
import sharedServices from "../services";

// --- utils
import { useValidation } from "../../../../utils";
import { getSupportedPaymentMethods, getPublicKey } from "./utils";
import { reject, set } from "lodash-es";

// --- types
import type { StripeContext } from "./types";
import type { AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------

async function load({ gateway }: StripeContext, _event: AnyEventObject) {
  const options = await sharedServices.load({ gateway }, _event);

  const key = getPublicKey(gateway);
  if (!key) return Promise.reject(new Error("Stripe public key not found."));

  const stripe = await loadStripe(key);

  return new Promise(resolve => {
    if (!stripe) {
      reject(new Error("Stripe not found."));
    } else {
      resolve({ stripe, ...(options || {}) });
    }
  });
}

async function validate(
  { schema, model, element, elementStatus }: StripeContext,
  { data }: AnyEventObject
) {
  // ---

  // Get any errors from the Stripe Element
  if (!element) return Promise.reject(new Error("Stripe elements not found."));

  // Now validate the model as per normal
  const { validate } = useValidation();

  return new Promise((resolve, reject) => {
    if (!schema) return resolve(model);

    const errors = validate(schema, model) || [];

    // NB: we are invalid if the stripe element status is NOT complete!
    if (!elementStatus?.complete) {
      errors.push({
        instancePath: "/payment_method_addition",
        schemaPath: "#/properties/payment_method_addition",
        keyword: "required",
        params: {
          missingProperty: "payment_method_addition",
        },
        message: "Stripe element is incomplete.",
      });
    }

    if (errors?.length) {
      reject({ error: errors });
    } else {
      resolve(model);
    }
  });
}

async function createPaymentElement(
  { amount, currency, gateway, stripe, address }: StripeContext,
  _event: AnyEventObject
) {
  // Flow ref: https://stripe.com/docs/payments/finalize-payments-on-the-server?platform=web&type=payment#additional-options
  const elements = stripe.elements({
    amount: Math.round((amount || 0) * 100), // NB: Stripe expects amount in cents
    currency: currency?.code.toLowerCase(), // NB: MUST be lowercase
    locale: "auto", // TODO: add i18n local
    mode: "payment",
    paymentMethodCreation: "manual",
    paymentMethodTypes: getSupportedPaymentMethods(gateway),
    setupFutureUsage: "off_session",
  });
  const element = elements?.create("payment", {
    defaultValues: {
      billingDetails: {
        address: {
          postal_code: address?.postcode,
          country: address?.country?.code,
        },
      },
    },
  });

  return new Promise(resolve => {
    resolve({
      elements,
      element,
    });
  });
}

/**
 * @name getPaymentData
 * @desc Here we create a new payment detail via the Stripe SDK, and return
 * the payment detail ID which we later relay to the BE (when executing
 * payment). We do not need to pass a client secret for flow, as the
 * payment detail is attached to a customer and confirmed server-side.
 */
async function update({ elements, stripe, model }: StripeContext) {
  if (!elements || !stripe)
    return Promise.reject(new Error("Gateway elements not found."));

  // Submit form to validate fields
  const { error: submitError } = await elements
    .submit()
    .catch((error: any) => Promise.reject(error));

  if (submitError) return Promise.reject(submitError);

  // Create PaymentMethod using details collected via Payment Element
  const { error, paymentMethod } = await stripe
    .createPaymentMethod({
      elements,
    })
    .catch((error: any) => Promise.reject(error));

  return new Promise((resolve, reject) => {
    if (error) {
      reject(error);
    } else {
      // add the payment details to the model
      set(
        model,
        "payment_method_addition.payment_method_id",
        paymentMethod?.id
      );
      set(
        model,
        "payment_method_addition.payment_method_type",
        paymentMethod?.type
      );

      /* Here we don't pass 'store_on_payment_auto_payment' flag as 'store_on_payment_auto_payment' is injected from parent gatewayComponent */
      resolve(model);
    }
  });
}

/**
 * @name beginSetup
 * @desc Here we obtain a client secret via the API, before creating a
 * Stripe 'Elements' instance.
 */
async function createAddElement(
  { stripe, gateway, address }: StripeContext,
  _event: AnyEventObject
) {
  const { post, useUrl } = useQuery();
  const { getUserId } = useSession();
  const client_id = await getUserId();

  return post<any>({
    url: useUrl(`gateway/frontend/tokenize-begin/${gateway?.id}`),
    withAccessToken: true,
    data: {
      client_id,
    },
  })
    .then(({ data }) => data)
    .then(data => {
      // Flow ref: https://stripe.com/docs/payments/save-and-reuse?platform=web&ui=elements#enable-payment-methods
      const clientPaymentDetailsId = data?.client_payment_details?.id;
      const clientSecret = data?.gateway_specific?.client_secret;

      // --- create stripe elements
      const elements = stripe.elements({
        clientSecret,
        locale: "auto", // TODO: add i18n local
      });

      const element = elements?.create("payment", {
        defaultValues: {
          billingDetails: {
            address: {
              postal_code: address?.postcode,
              country: address?.country?.code,
            },
          },
        },
      });
      // ---

      return {
        elements,
        element,
        clientSecret,
        clientPaymentDetailsId,
      };
    });
}

/**
 * @name confirmSetup
 * @desc Here we confirm the setup of a new detail using the Stripe SDK. We
 * may (or may not), be redirected off site at point – hence we save the
 * operation (and next procedure) into session storage.
 */
async function confirmSetup() {}

/**
 * @name endSetup
 * @desc If function is invoked, we in theory have a new payment detail
 * ID from Stripe. To finish up, we need to save detail as a payment
 * method within the Upmind ecosystem.
 */
async function endSetup() {}

// -----------------------------------------------------------------------------

export default {
  load,
  parse: sharedServices.parse,
  validate,
  // ---
  createPaymentElement,
  createAddElement,
  // ---
  confirmSetup,
  endSetup,
  update,
};
