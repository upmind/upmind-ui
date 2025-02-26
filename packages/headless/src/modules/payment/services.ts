// --- external

// --- internal
import { useApi } from "../..";

// --- utils
import { usePaymentParser } from "./utils";
import { isEmpty, get } from "lodash-es";

// --- types
import type { PaymentContext } from "./types";
import { FetchMethods } from "../api/services";
import type { AnyEventObject } from "xstate";

// --------------------------------------------------------
// Enums

export enum Targets {
  BLANK = "_blank",
  SELF = "_self",
  PARENT = "_parent",
  TOP = "_top",
}

// --------------------------------------------------------
// PRIVATE FUNCTIONS

/**
 * @name submitViaForm
 * @desc This function lets you programmatically create, insert and
 * submit a new form element so we can reliably hand-off to third party origins
 * without encountering any cross-origin (CORS) issues. */

function submitViaForm({
  fields,
  method = FetchMethods.GET,
  target = Targets.SELF,
  url,
}: {
  fields?: Record<string, any>;
  method?: FetchMethods;
  target?: Targets;
  url: string;
}) {
  return new Promise((resolve, reject) => {
    try {
      const form = document.createElement("form");

      form.target = target;
      form.method = method;
      form.action = url;
      form.style.display = "none";

      for (const key in fields || {}) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = get(fields, key);
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
      resolve({});
    } catch (error) {
      reject(error);
    }
  });
}

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

async function load(
  { order, paymentDetails }: PaymentContext,
  { data }: AnyEventObject
) {
  const { get, useUrl } = useApi();

  const urls = {
    return: undefined,
    cancel: undefined,
  };
  // TODO
  // generate urls for the payment gateway,  most will require a return and cancel url
  // const urls: PaymentContext["urls"] = {
  //   return: buildReturnUrl({
  //     externalAuthReturnLocation,
  //     paymentDetails
  //   }),
  //   cancel: undefined
  // };

  // if we already have the order, we don't need to load it again and we can return an empty object
  if (!isEmpty(order)) return Promise.resolve({ urls });

  if (!data?.id) return Promise.reject({ title: "Invalid order", code: 400 });

  return get({
    url: useUrl(`order/${data.id}`),
  }).then(({ data }: any) => ({ fields: data, urls }));
}

// --------------------------------------------------------

async function update(
  { order, paymentDetails }: PaymentContext,
  _event: AnyEventObject
) {
  const { post, useUrl } = useApi();

  // build the payload with ALL the data we need for the payment details AND the order
  const data = usePaymentParser({ paymentDetails, order });
  return post({
    url: useUrl(`/payments`),
    data,
    withAccessToken: true,
  }).then(({ data }: any) => data);
}

/**
 * @name redirect
 * @desc Here we redirect to an external URL (eg Stripe) and intentionally do
 * NOT resolve the function promise, ensuring the payment processing state
 * remains unchanged whilst the page offloads
 */
async function redirect(
  { payment, paymentDetails }: PaymentContext,
  _event: AnyEventObject
) {
  /**
   * Inject aborted state for cases when user click back from the browser
   * We have no router to handle this, so we need to handle it manually
   */
  if (paymentDetails?.cancel_url) {
    window.history.replaceState("", "", paymentDetails.cancel_url);
  }

  // Now submit the form generated from the approval_url
  return submitViaForm(payment.approval_form);
}

// --------------------------------------------------------

async function validate(
  { paymentDetails }: PaymentContext,
  _event: AnyEventObject
) {
  return new Promise((resolve, reject) => {
    if (isEmpty(paymentDetails)) {
      reject({ title: "Invalid payment details", code: 400 });
    } else {
      resolve({});
    }
  });
}

// --------------------------------------------------------
// EXPORTS

export default {
  load,
  update,
  validate,
  redirect,
};
