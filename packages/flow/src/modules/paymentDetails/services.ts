// --- external

// --- internal
import { useApi, useSession, useBrand, BrandConfigKeys } from "..";
// --- utils
import { useValidation } from "../../utils";
import {
  unset,
  get,
  sortBy,
  find,
  forEach,
  filter,
  includes,
  first,
} from "lodash-es";

// --- types
import { PaymentTypes } from "./types.d";
import type { PaymentDetailsEvent, PaymentDetailsContext } from "./types.d";

// --------------------------------------------------------
// ENUMS

const whitelistGatewayProviders =
  import.meta.env.VITE_APP_WHITELIST_GATEWAY_PROVIDERS.split(",");
// Array<string> = [
//   "73de7864-2de5-3971-4ef2-1208469530d0",
//   "72040386-96e5-4721-d9b5-18d9305e7d23",
//   "20403869-6e54-721d-59a5-18d9305e7d23",
//   // "5952098d-3de4-0917-e6c3-1578626e347e",
// ];

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

async function load(
  { currency }: PaymentDetailsContext,
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

  const currency_id = currency?.id || getCurrencyId(); // fallback to default currency

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

  const stored_payment_details = getRequest({
    url: useUrl(`clients/${client_id}/payment_details`, {
      limit: 0,
      brand_id,
      "filter[gateway.currencies.id]": currency_id,
      order: ["-default", "id"].join(),
      with: ["gateway", "client"].join(),
      // with_staged_imports: 1
    }),
    withAccessToken: true,
    useCache: true,
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
    useCache: true,
  }).then(({ data }) => {
    // Whitelist payment gateways if provided
    if (whitelistGatewayProviders.length) {
      data = filter(data, ({ gateway }) => {
        return includes(
          whitelistGatewayProviders,
          gateway.gateway_provider.code
        );
      });
    }
    return sortBy(data, ["order"]);
  });

  // ----

  return Promise.all([stored_payment_details, gateways]).then(
    ([stored_payment_details, gateways]) => ({
      stored_payment_details,
      gateways,
      payment_types: PaymentTypes,
    })
  );
}

// --------------------------------------------------------
// PAYMENT METHODS

/**
 * @name getPaymentData
 * @desc Here we create a new payment detail if we have a free basket, ie Amount = 0, and NO gateway provided
 *       Otherwise we reject this update and defer to the payment gateway
 */
async function update({ model, basket_id, currency }: PaymentDetailsContext) {
  return new Promise((resolve, reject) => {
    if (model?.amount == 0 && !model?.gateway_id) {
      resolve({
        basket_id: basket_id,
        amount: model.amount,
        currency,
      });
    } else {
      reject();
    }
  });
}

// --------------------------------------------------------

async function parse(
  { model, gateways }: PaymentDetailsContext,
  _event: PaymentDetailsEvent
) {
  // ---
  let gateway = null;

  // also make sure we set the gateway if we have one, otherwise we will use the first one
  if (model?.gateway_id) {
    gateway = find(gateways, {
      gateway_id: model.gateway_id,
    })?.gateway;
    // if we dont have a matching/valid gateway, then we should remove the gateway_id
    if (!gateway) unset(model, "gateway_id");
  }

  if (!model?.gateway_id && model?.amount > 0) {
    gateway = first(gateways)?.gateway;
    model.gateway_id = gateway?.id;
  }

  // NB: ensure we dont send the gateway_id if the payment type is pay later
  if (model?.type == PaymentTypes.PAY_LATER) {
    unset(model, "gateway_id");
  }

  return Promise.resolve({ model, gateway });
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
      reject({ error: errors, model });
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
  authSubscription: (context, event) =>
    useSession().authSubscription(context, event),
  isAuthenticated: () => useSession().isAuthenticated(),
};
