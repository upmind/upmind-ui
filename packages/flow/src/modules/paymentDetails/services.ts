// --- external

// --- internal
import { useApi, useSession, useBrand, BrandConfigKeys } from "..";
// --- utils
import { useValidation } from "../../utils";
import { unset, get, sortBy, find, forEach } from "lodash-es";

// --- types
import { PaymentTypes } from "./types.d";
import type { PaymentDetailsEvent, PaymentDetailsContext } from "./types.d";

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------

const { authSubscription, isAuthenticated } = useSession();

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

async function load(
  { currency_id }: PaymentDetailsContext,
  _event: PaymentDetailsEvent
) {
  const { isAuthenticated, getUserId } = useSession();

  await isAuthenticated().catch(error => Promise.reject(error));

  const { getBrandId, getCurrencyId, isReady, getConfig } = useBrand();
  const { get: getRequest, useUrl } = useApi();

  await isReady();

  // ---

  const client_id = await getUserId();
  const brand_id = getBrandId();

  currency_id ??= getCurrencyId();

  await getConfig([
    BrandConfigKeys.PARTIAL_PAYMENTS_ENABLED,
    BrandConfigKeys.PAY_LATER_ENABLED,
    BrandConfigKeys.BILLING_GATEWAY_FORCE_CARD_STORAGE,
    BrandConfigKeys.BILLING_GATEWAY_FORCE_AUTO_PAYMENT,
  ]).then(data => {
    if (!get(data, BrandConfigKeys.PARTIAL_PAYMENTS_ENABLED))
      unset(PaymentTypes, "PARTIAL_PAYMENT");

    if (!get(data, BrandConfigKeys.PAY_LATER_ENABLED))
      unset(PaymentTypes, "PAY_LATER");
  });

  // ---

  const balance = getRequest({
    url: useUrl(`wallet/balance`, {
      currency_id,
      // with_staged_imports=1
    }),
    withAccessToken: true,
    useCache: false,
  }).then(({ data }) => data);

  // ---

  const payment_details = getRequest({
    url: useUrl(`clients/${client_id}/payment_details`, {
      limit: 0,
      brand_id,
      "filter[gateway.currencies.id]": currency_id,
      order: ["-default", "id"].join(),
      with: ["gateway", "client"].join(),
      // with_staged_imports: 1
    }),
    withAccessToken: true,
    useCache: false,
  }).then(({ data }) => data);

  // ---

  const gateways = getRequest({
    url: useUrl(`brands/${brand_id}/gateways`, {
      limit: 0,
      client_id,
      order: "order",
      "filter[gateway.currencies.id]": currency_id,
      "filter:[active]": 1,
      with: ["gateway.gateway_provider", "gateway.card_types"].join(),
    }),
    withAccessToken: true,
    useCache: false,
  }).then(({ data }) => sortBy(data, ["order"]));

  // ----

  return Promise.all([balance, payment_details, gateways]).then(
    ([balance, payment_details, gateways]) => ({
      balance,
      payment_details,
      gateways,
      payment_types: PaymentTypes,
    })
  );
}

// --------------------------------------------------------

async function parse(
  { model, actors, gateways }: PaymentDetailsContext,
  _event: PaymentDetailsEvent
) {
  // ---
  let gateway = null;

  // ensure we dont send the gateway_id if the payment type is pay later
  if (model?.type == PaymentTypes.PAY_LATER) {
    unset(model, "gateway_id");
  }

  // also make sure we clear the gateway actor if we have no gateway_id
  else if (model?.gateway_id) {
    gateway = find(gateways, {
      gateway_id: model.gateway_id,
    })?.gateway; // we dont need the full brand gateway, just the actual gateway;
  }

  return Promise.resolve({ model, gateway, actors });
}

async function validate(
  { schema, model, actors }: PaymentDetailsContext,
  _event: PaymentDetailsEvent
) {
  // ---

  // Now validate the model as per normal
  const { validate } = useValidation();

  return new Promise((resolve, reject) => {
    //
    const errors = validate(schema, model) || [];

    // ALSO check if any of our actors are in an invalid state
    forEach(actors, actor => {
      if (["invalid"].some(actor.state.matches)) {
        errors.push(actor.state.context.error);
      }
    });

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
  // ---
  authSubscription,
  isAuthenticated,
};
