// --- external

// --- internal
import { useApi, useSession, useBrand } from "..";

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
import { BrandConfigKeys, PaymentType } from "@upmind-automation/types";
import { GatewayTypes } from "./gateways/types";
import type { PaymentDetailsContext } from "./types";
import { waitFor } from "xstate/lib/waitFor";
import type { AnyEventObject } from "xstate";

// --------------------------------------------------------
// ENUMS
const whitelistGatewayProviders = (
  import.meta.env.VITE_APP_WHITELIST_GATEWAY_PROVIDERS || ""
).split(",");

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data
async function load(
  { currency, address }: PaymentDetailsContext,
  _event: AnyEventObject
) {
  const { isAuthenticated, getUserId } = useSession();

  await isAuthenticated().catch(error => Promise.reject(error));

  const { getBrandId, getCurrencyId, isReady, getConfig } = useBrand();
  const { get: getRequest, useUrl } = useApi();

  await isReady().catch(error => Promise.reject(error));

  // ---

  const clientId = await getUserId();
  const brandId = getBrandId();

  const currencyId = currency?.id || getCurrencyId(); // fallback to default currency

  await getConfig([
    BrandConfigKeys.PARTIAL_PAYMENTS_ENABLED,
    BrandConfigKeys.PAY_LATER_ENABLED,
    BrandConfigKeys.BILLING_GATEWAY_FORCE_CARD_STORAGE,
    BrandConfigKeys.BILLING_GATEWAY_FORCE_AUTO_PAYMENT,
  ]).then(data => {
    if (!get(data, BrandConfigKeys.PARTIAL_PAYMENTS_ENABLED))
      unset(PaymentType, "PARTIAL_PAYMENT");

    if (!get(data, BrandConfigKeys.PAY_LATER_ENABLED))
      unset(PaymentType, "PAY_LATER");
  });

  // ---

  const stored_payment_methods = getRequest({
    url: useUrl(`clients/${clientId}/payment_details`, {
      limit: 0,
      brand_id: brandId,
      active: true,
      "filter[gateway.currencies.id]": currencyId,
      // "filter[active]": 1,

      order: ["-default", "id"].join(),
      with: ["gateway", "client"].join(),
      // with_staged_imports: 1
    }),
    withAccessToken: true,
    useCache: true,
  }).then(({ data }: any) => data);

  // ---

  const gateways = getRequest({
    url: useUrl(`brands/${brandId}/gateways`, {
      limit: 0,
      client_id: clientId,
      order: "order",
      "filter[gateway.currencies.id]": currencyId,
      "filter[active]": 1,
      with: ["gateway.gateway_provider", "gateway.card_types"].join(),
    }),
    withAccessToken: true,
    useCache: true,
  }).then(({ data }: any) => {
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

  return Promise.all([stored_payment_methods, gateways, address]).then(
    ([stored_payment_methods, gateways, address]) => {
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
        payment_types: PaymentType,
        address,
      };
    }
  );
}

// --------------------------------------------------------
// PAYMENT METHODS

// --------------------------------------------------------

async function parse(
  { model, gateways }: PaymentDetailsContext,
  { data }: AnyEventObject
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
  safeModel.type ??= PaymentType.PAY_IN_FULL;
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
  if (safeModel?.type == PaymentType.PAY_LATER || safeModel?.amount <= 0) {
    unset(safeModel, "gateway_id");
    gateway = null;
  }

  return Promise.resolve({ model: safeModel, gateway });
}

async function validate(
  { schema, model, actors }: PaymentDetailsContext,
  _event: AnyEventObject
) {
  // ---

  // Now validate the model as per normal
  const { validate } = useValidation();

  //
  const errors = validate(schema, model) || [];

  // ALSO check if any of our actors are in an invalid state
  // NB, wait for them to finish loading/checking before we proceed
  const promises = map(actors, actor => {
    if (!actor) return;
    return waitFor(
      actor,
      state => !["loading", "checking", "error"].some(state.matches)
    );
  });

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
  // ---
  authSubscription: (context: any, event: any) =>
    useSession().authSubscription(context, event),
  isAuthenticated: () => useSession().isAuthenticated(),
};
