// --- external
import { loadBraintree } from "@braintree/braintree-js";

// --- internal
import sharedServices from "../services";
import { useQuery, useSession } from "../../..";

// --- utils
import {
  ErrorOrigin,
  DetailedError,
  responseCodes,
  useValidation,
  NotAuthenticatedError
} from "../../../../utils";
import { reject, set } from "lodash-es";
import { getSupportedPaymentMethods, getPublicKey } from "./utils";

// --- types
import type { BraintreeContext } from "./types";
import type { AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------

async function load({ gateway }: BraintreeContext, _event: AnyEventObject) {
  const options = await sharedServices.load({ gateway }, _event);

  const key = getPublicKey(gateway);
  if (!key)
    return Promise.reject(
      new DetailedError(
        "Braintree public key not found.",
        responseCodes.Not_Found,
        ErrorOrigin.Headless
      )
    );

  const braintree = await loadBraintree(key);

  return new Promise(resolve => {
    if (!braintree) {
      reject(
        new DetailedError(
          "Braintree not found.",
          responseCodes.Not_Found,
          ErrorOrigin.Headless
        )
      );
    } else {
      resolve({ braintree, ...(options || {}) });
    }
  });
}

async function validate(
  { schema, model, element, elementStatus }: BraintreeContext,
  { data }: AnyEventObject
) {
  // ---

  // Get any errors from the Braintree Element
  if (!element)
    return Promise.reject(
      new DetailedError(
        "Braintree element not found.",
        responseCodes.Not_Found,
        ErrorOrigin.Headless
      )
    );

  // Now validate the model as per normal
  const { validate } = useValidation();

  return new Promise((resolve, reject) => {
    if (!schema) return resolve(model);

    const errors = validate(schema, model) || [];

    // NB: we are invalid if the braintree element status is NOT complete!
    if (!elementStatus?.complete) {
      errors.push({
        instancePath: "/payment_method_addition",
        schemaPath: "#/properties/payment_method_addition",
        keyword: "required",
        params: {
          missingProperty: "payment_method_addition"
        },
        message: "Braintree element is incomplete."
      });
    }

    if (errors?.length) {
      reject(
        new DetailedError(
          "Braintree validation failed",
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

async function createPaymentElement(
  { amount, currency, gateway, braintree, address }: BraintreeContext,
  _event: AnyEventObject
) {
  // Flow ref: https://braintree.com/docs/payments/finalize-payments-on-the-server?platform=web&type=payment#additional-options
  const elements = braintree.elements({
    amount: Math.round((amount || 0) * 100), // NB: Braintree expects amount in cents
    currency: currency?.code.toLowerCase(), // NB: MUST be lowercase
    locale: "auto", // TODO: add i18n local
    mode: "payment",
    paymentMethodCreation: "manual",
    paymentMethodTypes: getSupportedPaymentMethods(gateway),
    setupFutureUsage: "off_session"
  });
  const element = elements?.create("payment", {
    defaultValues: {
      billingDetails: {
        address: {
          postal_code: address?.postcode,
          country: address?.country?.code
        }
      }
    }
  });

  return new Promise(resolve => {
    resolve({
      elements,
      element
    });
  });
}

/**
 * @name pay
 * @desc Here we create a new payment detail via the Braintree SDK, and return
 * the payment detail ID which we later relay to the BE (when executing
 * payment). We do not need to pass a client secret for flow, as the
 * payment detail is attached to a customer and confirmed server-side.
 */
async function pay({ elements, braintree, model }: BraintreeContext) {
  if (!elements || !braintree)
    return Promise.reject(
      new DetailedError(
        "Braintree elements or braintree not found.",
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
          "Braintree element submission failed.",
          responseCodes.Unprocessable_Entity,
          ErrorOrigin.Headless,
          error
        )
      )
    );

  if (submitError) return Promise.reject(submitError);

  // Create PaymentMethod using details collected via Payment Element
  const { error, paymentMethod } = await braintree
    .createPaymentMethod({
      elements
    })
    .catch((error: any) => Promise.reject(error));

  return new Promise((resolve, reject) => {
    if (error) {
      reject(
        new DetailedError(
          error.message ?? "Braintree create payment method failed.",
          responseCodes.Unprocessable_Entity,
          ErrorOrigin.Headless,
          error
        )
      );
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
 * @name createAddElement
 * @desc Here we obtain a client secret via the API, before creating a
 * Braintree 'Elements' instance.
 */
async function createAddElement(
  { braintree, gateway, address }: BraintreeContext,
  _event: AnyEventObject
) {
  const { post, useUrl } = useQuery();

  const { meta, user } = useSession();

  if (!meta.value.isAuthenticated || !user.value?.id)
    await Promise.reject(new NotAuthenticatedError());

  const clientId = user.value!.id;

  return post<any>({
    url: useUrl(`gateway/frontend/tokenize-begin/${gateway?.id}`),
    withAccessToken: true,
    data: {
      client_id: clientId
    }
  }).then(data => {
    // Flow ref: https://braintree.com/docs/payments/save-and-reuse?platform=web&ui=elements#enable-payment-methods
    const clientPaymentDetailsId = data?.client_payment_details?.id;
    const clientSecret = data?.gateway_specific?.client_secret;

    // --- create braintree elements
    const elements = braintree.elements({
      clientSecret,
      locale: "auto" // TODO: add i18n local
    });

    const element = elements?.create("payment", {
      defaultValues: {
        billingDetails: {
          address: {
            postal_code: address?.postcode,
            country: address?.country?.code
          }
        }
      }
    });
    // ---

    return {
      elements,
      element,
      clientSecret,
      clientPaymentDetailsId
    };
  });
}

/**
 * @name add
 * @desc Here we confirm the setup of a new detail using the Braintree SDK. We
 * may (or may not), be redirected off site at point – hence we save the
 * operation (and next procedure) into session storage.
 */
async function add() {
  // TODO
}

/**
 * @name endSetup
 * @desc If function is invoked, we in theory have a new payment detail
 * ID from Braintree. To finish up, we need to save detail as a payment
 * method within the Upmind ecosystem.
 */
async function endSetup() {
  //TODO
}

// -----------------------------------------------------------------------------

export default {
  load,
  parse: sharedServices.parse,
  validate,
  // ---
  createPaymentElement,
  createAddElement,
  // ---
  add,
  pay
};
