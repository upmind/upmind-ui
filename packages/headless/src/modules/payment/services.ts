// --- external

// --- internal
import { useQuery } from "../..";

// --- utils
import { usePaymentParser } from "./utils";
import { isEmpty, get } from "lodash-es";

// --- types
import { Methods, Targets } from "@upmind-automation/types";
import { type PaymentContext } from "./types";
import type { AnyEventObject } from "xstate";

// --------------------------------------------------------
// Enums

// --------------------------------------------------------
// PRIVATE FUNCTIONS

/**
 * @name submitViaForm
 * @desc This function lets you programmatically create, insert and
 * submit a new form element so we can reliably hand-off to third party origins
 * without encountering any cross-origin (CORS) issues. */

function submitViaForm({
  fields,
  method = Methods.GET,
  target = Targets.SELF,
  url,
}: {
  fields?: Record<string, any>;
  method?: Methods;
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

async function load({ orderId }: PaymentContext, { data }: AnyEventObject) {
  const { get, useUrl } = useQuery();

  // if we already have the order, we don't need to load it again and we can return an empty object
  if (!isEmpty(orderId)) return Promise.resolve({ fields: [] });

  if (!data?.id) return Promise.reject({ title: "Invalid order", code: 400 });

  debugger; //TODO check data id vs orderId

  return get({
    url: useUrl(`order/${orderId}`),
    queryKey: ["order", { id: orderId }],
  }).then(({ data }: any) => ({ fields: data }));
}

// --------------------------------------------------------

async function update(context: PaymentContext, _event: AnyEventObject) {
  const { post, useUrl } = useQuery();

  // build the payload with ALL the data we need for the payment details AND the order
  const data = usePaymentParser(context);
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
  { payment, paymentDetail, cancel, approval }: PaymentContext,
  _event: AnyEventObject
) {
  /**
   * Inject aborted state for cases when user click back from the browser
   * We have no router to handle this, so we need to handle it manually
   */
  debugger;
  if (cancel) window.history.replaceState("", "", cancel?.url);

  if (approval) return submitViaForm(approval);
}

// --------------------------------------------------------

async function validate(
  { paymentDetail }: PaymentContext,
  _event: AnyEventObject
) {
  return new Promise((resolve, reject) => {
    if (isEmpty(paymentDetail)) {
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
