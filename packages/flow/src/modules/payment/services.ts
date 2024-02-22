// --- external

// --- internal
import { useApi, useSession } from "../..";

// --- utils
import { usePaymentParser } from "./utils";
import { isEmpty } from "lodash-es";

// --- types
import type { PaymentEvent, PaymentContext } from "./types.d";

// --------------------------------------------------------

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

async function load({ order }: PaymentContext, { data }: PaymentEvent) {
  const { get, useUrl } = useApi();

  // if we already have the order, we don't need to load it again and we can return an empty object
  if (!isEmpty(order)) return Promise.resolve({});

  if (!data?.id) return Promise.reject({ title: "Invalid order", code: 400 });

  return get({
    url: useUrl(`order/${data.id}`)
  }).then(({ data }) => ({ fields: data }));
}

// --------------------------------------------------------

async function update(
  { order, paymentDetails }: PaymentContext,
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
