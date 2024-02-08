// --- external

// --- internal
import { useApi, useSession, useBrand } from "../../";
const { authSubscription, isAuthenticated } = useSession();

// --- utils
import { useValidation } from "../../utils";

// --- types
import type { PaymentDetailsEvent, PaymentDetailsContext } from "./types.d";

// --------------------------------------------------------

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

async function load(
  _context: PaymentDetailsContext,
  _event: PaymentDetailsEvent
) {
  const { getBrandId, getCurrency, isReady } = useBrand();
  const { get, useUrl } = useApi();
  const { getUserId } = useSession();

  await isReady();

  const client_id = await getUserId();
  const brand_id = getBrandId(); // "47d73824-8507-9315-e54f-81e642d59e06";
  const currency_id = getCurrency(); //"e47d7382-4850-7931-56c8-1e642d59e063";

  // ---

  const balance = get({
    url: useUrl(`wallet/balance`, {
      currency_id
      // with_staged_imports=1
    }),
    withAccessToken: true,
    useCache: false
  }).then(({ data }) => data);

  // ---

  const payment_details = get({
    url: useUrl(`clients/${client_id}/payment_details`, {
      limit: 0,
      brand_id,
      "filter[gateway.currencies.id]": currency_id,
      order: ["-default", "id"].join(),
      with: ["gateway", "client"].join()
      // with_staged_imports: 1
    }),
    withAccessToken: true,
    useCache: false
  }).then(({ data }) => data);

  // ---

  const gateways = get({
    url: useUrl(`brands/${brand_id}/gateways`, {
      limit: 0,
      client_id,
      order: "order",
      "filter[gateway.currencies.id]": currency_id,
      "filter:[active]": 1,
      with: ["gateway.gateway_provider", "gateway.card_types"].join()
    }),
    withAccessToken: true,
    useCache: false
  }).then(({ data }) => data);

  return Promise.all([balance, payment_details, gateways]).then(
    ([balance, payment_details, gateways]) => ({
      balance,
      payment_details,
      gateways
    })
  );
}

// --------------------------------------------------------

async function update(
  { model }: PaymentDetailsContext,
  _event: PaymentDetailsEvent
) {
  // const { put, useUrl } = useApi();
  // const { getUserId } = useSession();
  // const client_id = await getUserId();
  // return put({
  //   url: useUrl(`clients/${client_id}/PaymentDetails/${model.id}`),
  //   data: {
  //     PaymentDetails: model.PaymentDetails,
  //     type: model.type
  //   },
  //   withAccessToken: true
  // }).then(({ data }) => data);
}

// --------------------------------------------------------

async function parse(
  { model }: PaymentDetailsContext,
  _event: PaymentDetailsEvent
) {
  // ---
  // we dont have any parsing checks or transforms so we can pass through the model
  return Promise.resolve({ model });
}

async function validate(
  { schema, model }: PaymentDetailsContext,
  _event: PaymentDetailsEvent
) {
  // ---

  // Now validate the model as per normal
  const { validate } = useValidation();

  return new Promise((resolve, reject) => {
    const errors = validate(schema, model);
    if (errors?.length) {
      reject({ error: errors });
    } else {
      resolve(model);
    }
  });
}

// --------------------------------------------------------
// EXPORTS

export default {
  load,
  parse,
  validate,
  update,
  // ---
  authSubscription,
  isAuthenticated
};
