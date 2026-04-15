// --- external

// --- internal
import { useI18n, useQuery } from "../../..";
import sharedServices from "../services";
import { beginSetup } from "../services";

// --- utils
import {
  ErrorOrigin,
  DetailedError,
  responseCodes,
  useScripts,
  useUrl
} from "../../../../utils";

// --- types
import {
  type RazorpayContext,
  type IRazorpaySetupDetails,
  type RazorpayResponse,
  type RazorpayErrorResponse
} from "./types";
import type { AnyEventObject } from "xstate";

// --- utils
import { get, isEmpty, isNil, omit, set } from "lodash-es";

// --- types
import type { GatewayContext } from "../types";
import { parseSettings } from "../utils";
import { isFunction } from "xstate/lib/utils";

// -----------------------------------------------------------------------------

async function load(context: RazorpayContext, _event: AnyEventObject) {
  //  first get our default load config
  const { gateway } = context;
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

    // load in our Razorpay scripts

    return useScripts()
      .load("razorpay_v1", "https://checkout.razorpay.com/v1/checkout.js", {
        onSuccess: () => {
          return true;
        },
        onError: () => {
          return false;
        }
      })
      .then(() => {
        // Get the Razorpay instance from the window object
        const Razorpay = window["Razorpay"];

        if (!Razorpay || !isFunction(Razorpay))
          throw new DetailedError(
            t("error.payment_gateway_not_available"),
            responseCodes.Not_Found,
            ErrorOrigin.Headless
          );

        return { sdk: { razorpay: Razorpay }, ...config };
      });
  });
}

async function render({ sdk }: RazorpayContext, { data }: AnyEventObject) {
  const { t } = useI18n();

  if (!sdk?.razorpay) {
    throw new DetailedError(
      t("error.payment_gateway_not_available"),
      responseCodes.Not_Found,
      ErrorOrigin.Headless,
      { sdk, container: data?.container }
    );
  }

  // we dont have an render functions for Razorpay Card so just return the necessary data
  return { sdk, container: null, validationHelper: null };
}

/**
 * @name getPaymentData
 * @desc Here we create a new payment detail via the Card SDK, and return
 * the payment detail ID which we later relay to the BE (when executing
 * payment). We do not need to pass a client secret for flow, as the
 * payment detail is attached to a customer and confirmed server-side.
 */
async function pay({
  gateway,
  sdk,
  currency,
  model,
  client,
  amount
}: RazorpayContext) {
  const { t } = useI18n();

  if (!sdk?.razorpay)
    return Promise.reject(
      new DetailedError(
        t("error.payment_gateway_not_available"),
        responseCodes.Not_Found,
        ErrorOrigin.Headless
      )
    );

  const { get: getRequest, useUrl } = useQuery();

  // 1. Get setup details from Upmind API (order_id etc)
  const setup = await getRequest<{ gateway_specific: IRazorpaySetupDetails }>({
    url: useUrl(`gateway/frontend/${gateway.id}`, {
      amount: amount || 1,
      currency: currency.code,
      client_id: client.id,
      return_url: window.location.href
    }),
    queryKey: ["gateway", "frontend", gateway.id],
    withAccessToken: true,
    staleTime: 0, // disable cache, this may still return stale data while the request is in flight
    gcTime: 0 // force cache to be cleared immediately, to prevent stale data
  }).then(response => response.gateway_specific);

  // 2. Create new Razorpay instance
  const rzp = new window.Razorpay({
    customer_id: setup.customer_id,
    key: setup.key_id,
    order_id: setup.order_id,
    recurring: model?.store_on_payment ?? true
  });

  // 3. Open Razorpay modal and handle response
  return new Promise((resolve, reject) => {
    let error: RazorpayErrorResponse["error"];
    if (!rzp) throw Error("Razorpay instance not defined.");
    // Set response handler
    rzp.set("handler", (response: RazorpayResponse) => {
      if (isNil(response.razorpay_payment_id)) {
        return reject(
          new DetailedError(
            t("error.payment_gateway_not_available"),
            responseCodes.Unprocessable_Entity,
            ErrorOrigin.External
          )
        );
      }
      // add the payment details to the model
      set(model!, "payment_method_addition", response);
      resolve(model);
    });
    // Set payment failed error handler
    rzp.on("payment.failed", (response: RazorpayErrorResponse) => {
      // We don't reject here as the Razorpay modal allows users to retry
      // payment and subsequent attempts may succeed.
      // this.$store.dispatch("api/handleError", response?.error?.description);
      error = response.error;
    });
    // Set modal dismiss handler
    rzp.set("modal.ondismiss", () => {
      // dont throw an actual error, just reject to be able to restart the payment process
      if (isEmpty(error)) {
        reject();
      } else {
        reject(
          new DetailedError(
            error.description,
            error.code,
            ErrorOrigin.External,
            error
          )
        );
      }
    });
    // Open Razorpay modal
    rzp.open();
  });
}

/**
 * @name add
 * @desc Stores a payment method via Razorpay in the ADD context.
 * Calls beginSetup → opens Razorpay modal → endSetup with response token.
 */
async function add(context: RazorpayContext) {
  const { sdk, model, currency, client, amount, gateway } = context;
  const { t } = useI18n();

  if (!sdk?.razorpay)
    throw new DetailedError(
      t("error.payment_gateway_not_available"),
      responseCodes.Not_Found,
      ErrorOrigin.Headless
    );

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

  const { get: getRequest, useUrl } = useQuery();

  const setup = await getRequest<{ gateway_specific: IRazorpaySetupDetails }>({
    url: useUrl(`gateway/frontend/${gateway.id}`, {
      amount: amount || 1,
      currency: currency.code,
      client_id: client.id,
      return_url: window.location.href
    }),
    queryKey: ["gateway", "frontend", gateway.id],
    withAccessToken: true,
    staleTime: 0,
    gcTime: 0
  }).then(response => response.gateway_specific);

  const rzp = new window.Razorpay({
    customer_id: setup.customer_id,
    key: setup.key_id,
    order_id: setup.order_id,
    recurring: model?.store_on_payment ?? true
  });

  return new Promise((resolve, reject) => {
    let error: RazorpayErrorResponse["error"];
    if (!rzp) throw Error("Razorpay instance not defined.");

    rzp.set("handler", (response: RazorpayResponse) => {
      if (isNil(response.razorpay_payment_id)) {
        return reject(
          new DetailedError(
            t("error.payment_gateway_not_available"),
            responseCodes.Unprocessable_Entity,
            ErrorOrigin.External
          )
        );
      }

      resolve({
        gatewayId: context.gateway?.id,
        data: {
          client_payment_details_id: clientPaymentDetailsId,
          auto_payment: model?.store_on_payment_auto_payment ?? false,
          ...response
        }
      });
    });

    rzp.on("payment.failed", (response: RazorpayErrorResponse) => {
      error = response.error;
    });

    rzp.set("modal.ondismiss", () => {
      if (isEmpty(error)) {
        reject();
      } else {
        reject(
          new DetailedError(
            error.description,
            error.code,
            ErrorOrigin.External,
            error
          )
        );
      }
    });

    rzp.open();
  });
}

// -----------------------------------------------------------------------------

export default {
  ...sharedServices,
  // ---
  load,
  render,
  pay,
  add
};
