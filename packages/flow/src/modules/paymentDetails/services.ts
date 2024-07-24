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
  map,
  forEach,
  filter,
  includes,
  first,
  defaultsDeep,
  pick,
} from "lodash-es";

// --- types
import { GatewayTypes } from "./gateways/types.d";
import { PaymentTypes } from "./types.d";
import type { PaymentDetailsEvent, PaymentDetailsContext } from "./types.d";
import { waitFor } from "xstate/lib/waitFor";

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

  const stored_payment_methods = getRequest({
    url: useUrl(`clients/${client_id}/payment_details`, {
      limit: 0,
      brand_id,
      active: true,
      "filter[gateway.currencies.id]": currency_id,
      // "filter[active]": 1,

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
      "filter[active]": 1,
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

  return Promise.all([stored_payment_methods, gateways]).then(
    ([stored_payment_methods, gateways]) => {
      // ensure we only show active stored payment methods
      stored_payment_methods = filter(stored_payment_methods, "active");

      // If we have stored payment methods, then we MUSt add a 'gateway' for them
      if (stored_payment_methods?.length) {
        gateways.unshift({
          gateway_id: "stored",
          gateway: {
            id: "stored",
            name: "Pay with an existing method",
            type: GatewayTypes.STORED,
          },
        });
      }

      return {
        stored_payment_methods,
        gateways,
        payment_types: PaymentTypes,
      };
    }
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
  // if we have a free basket, Or a gateway is provided, then we should not create a payment detail
  return new Promise((resolve, reject) => {
    if (model?.amount == 0) {
      resolve({
        basket_id,
        currency,
        amount: model.amount,
      });
    } else {
      reject();
    }
  });
}

// --------------------------------------------------------

async function parse(
  { model, gateways, stored_payment_methods }: PaymentDetailsContext,
  { data }: PaymentDetailsEvent
) {
  // ---
  let gateway = null;

  // ---
  // Create a safe model to work with
  const safeModel = defaultsDeep(
    pick(data, ["amount", "type", "gateway_id"]),
    model
  );

  // ---
  // HACK: TEMP: FORCE payment type to PAY_IN_FULL
  safeModel.type ??= PaymentTypes.PAY_IN_FULL;

  // ---
  // Gateway vs Stored Payment Methods Logic...

  // 1) Make sure if a gateway is selected that we use that
  if (safeModel?.gateway_id) {
    gateway = find(gateways, {
      gateway_id: safeModel.gateway_id,
    })?.gateway;
    // if we dont have a matching/valid gateway, then we should remove the gateway_id
    if (!gateway) unset(safeModel, "gateway_id");
  }

  // 2) finally If we dont have any selected gateways then we should use the first available
  if (!safeModel.gateway_id) {
    gateway = first(gateways)?.gateway;
    safeModel.gateway_id = gateway?.id;
  }

  // 3) Safety Check...if the payment type is pay later or Free, clear the gateway_id
  if (safeModel?.type == PaymentTypes.PAY_LATER || safeModel?.amount <= 0) {
    unset(safeModel, "gateway_id");
    gateway = null;
  }

  return Promise.resolve({ model: safeModel, gateway });
}

async function validate(
  { schema, model, actors }: PaymentDetailsContext,
  _event: PaymentDetailsEvent
) {
  // ---

  // Now validate the model as per normal
  const { validate } = useValidation();

  //
  const errors = validate(schema, model) || [];

  // ALSO check if any of our actors are in an invalid state
  // NB, wait for them to finish loading/checking before we proceed
  const promises = map(actors, actor =>
    waitFor(
      actor,
      state => !["loading", "checking", "error"].some(state.matches)
    )
  );

  await Promise.all(promises)
    .then(responses => {
      forEach(responses, state => {
        if (["error", "invalid"].some(state.matches)) {
          errors.push(state.context.error);
        }
      });
    })
    .catch(errors => {
      errors.push(...errors);
    });

  return new Promise((resolve, reject) => {
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
