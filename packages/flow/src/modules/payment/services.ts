// --- external

// --- internal
import { useApi, useSession } from "../..";

// --- utils
import { usePaymentParser } from "./utils";
import { isEmpty, get, forEach, isNil, merge, omitBy } from "lodash-es";

// --- types
import type { PaymentEvent, PaymentContext } from "./types.d";
import { FetchMethods } from "../api/services";

// --------------------------------------------------------
// Enums

export enum Targets {
  BLANK = "_blank",
  SELF = "_self",
  PARENT = "_parent",
  TOP = "_top"
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
  url
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

      forEach(fields, (value, key) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = get(fields, key);
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
      resolve({});
    } catch (error) {
      reject(error);
    }
  });
}

function buildResolver({
  url,
  params,
  paymentMethodType = null,
  autoPay = undefined,
  initPay = undefined
}) {
  const query = omitBy(
    {
      [QUERY_PARAMS.AUTO_PAY]: encodeURIComponent(
        btoa(JSON.stringify(autoPay))
      ),
      [QUERY_PARAMS.INIT_PAY]: encodeURIComponent(
        btoa(JSON.stringify(initPay))
      ),
      [QUERY_PARAMS.PAYMENT_METHOD_TYPE]: paymentMethodType,
      ...params
    },
    isNil
  );

  return this.$router.resolve(merge(url, { query }));
}
// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

async function load(
  { order, paymentDetails }: PaymentContext,
  { data }: PaymentEvent
) {
  const { get, useUrl } = useApi();

  const urls = {
    return: undefined,
    cancel: undefined
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
    url: useUrl(`order/${data.id}`)
  }).then(({ data }) => ({ fields: data, urls }));
}

// --------------------------------------------------------

async function update(
  { order, paymentDetails, urls }: PaymentContext,
  _event: PaymentEvent
) {
  const { post, useUrl } = useApi();

  const { isAuthenticated } = useSession();

  await isAuthenticated().catch(() =>
    Promise.reject({ title: "Unauthorized", code: 401 })
  );

  // build the payload with ALL the data we need for the payment details AND the order
  return post({
    url: useUrl(`/payments`),
    data: usePaymentParser({ paymentDetails, order }),
    withAccessToken: true
  }).then(({ data }) => data);
}

/**
 * @name redirect
 * @desc Here we redirect to an external URL (eg Stripe) and intentionally do
 * NOT resolve the function promise, ensuring the payment processing state
 * remains unchanged whilst the page offloads
 */
async function redirect(
  { order, payment, paymentDetails }: PaymentContext,
  _event: PaymentEvent
) {
  const url = new URL(payment.approval_url);

  /**
   * Inject aborted state for cases when user click back from the browser
   * We have no router to handle this, so we need to handle it manually
   */
  const cancelPath = new URL(paymentDetails?.cancel_url, {
    basketId: order.id,
    [QUERY_PARAMS.ORDER_ID]: order.id,
    [QUERY_PARAMS.AUTO_PAY]: encodeURIComponent(
      btoa(JSON.stringify(paymentDetails.auto_payment))
    ),
    [QUERY_PARAMS.INIT_PAY]: encodeURIComponent(
      btoa(
        JSON.stringify(
          paymentDetails?.external ? { invoiceId: order.id } : undefined
        )
      )
    ),
    [QUERY_PARAMS.PAYMENT_METHOD_TYPE]: paymentDetails.type
  });

  window.history.replaceState("", "", `${location.origin}${cancelPath}`);
  Promise.resolve();
}

// --------------------------------------------------------

async function validate(
  { paymentDetails }: PaymentContext,
  _event: PaymentEvent
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
  validate
};
