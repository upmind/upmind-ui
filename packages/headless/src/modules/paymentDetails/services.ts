// --- external
import { unref } from "vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useBrand, useQuery, useSession } from "..";

// --- utils
import {
  get,
  map,
  find,
  pick,
  first,
  unset,
  filter,
  sortBy,
  forEach,
  includes,
  defaultsDeep
} from "lodash-es";
import {
  ErrorOrigin,
  DetailedError,
  responseCodes,
  useValidation,
  NotAuthenticatedError,
  useModelParser,
  stateMatches
} from "../../utils";

// --- types
import { GatewayTypes } from "./gateways/types";
import type { AnyEventObject } from "xstate";
import type { PaymentDetailsContext } from "./types";
import { BrandConfigKeys, PaymentType } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const whitelistGatewayProviders = (
  import.meta.env.VITE_APP_WHITELIST_GATEWAY_PROVIDERS || ""
).split(",");

async function load(
  { currency, address }: PaymentDetailsContext,
  _event: AnyEventObject
) {
  const { meta, user } = useSession();

  if (!meta.value.isAuthenticated || !user.value?.id) {
    return Promise.reject(new NotAuthenticatedError());
  }

  const { brandId, currencyId: defaultCurrencyId, ensureConfig } = useBrand();
  const { get: getRequest, useUrl } = useQuery();

  // ---

  const clientId = user.value!.id;
  const currencyId = currency?.id || defaultCurrencyId.value; // fallback to default currency

  await ensureConfig([
    BrandConfigKeys.PARTIAL_PAYMENTS_ENABLED,
    BrandConfigKeys.PAY_LATER_ENABLED,
    BrandConfigKeys.BILLING_GATEWAY_FORCE_CARD_STORAGE,
    BrandConfigKeys.BILLING_GATEWAY_FORCE_AUTO_PAYMENT
  ]).then(data => {
    if (!get(data, BrandConfigKeys.PARTIAL_PAYMENTS_ENABLED))
      unset(PaymentType, "PARTIAL_PAYMENT");

    if (!get(data, BrandConfigKeys.PAY_LATER_ENABLED))
      unset(PaymentType, "PAY_LATER");
  });

  // ---

  const stored_payment_methods = getRequest<any>({
    url: useUrl(`clients/${clientId}/payment_details`, {
      limit: 0,
      brand_id: unref(brandId),
      active: true,
      "filter[gateway.currencies.id]": currencyId,
      // "filter[active]": 1,

      order: ["-default", "id"].join(),
      with: ["gateway", "client"].join()
      // with_staged_imports: 1
    }),
    queryKey: [
      "payment-details",
      { clientId, brandId: unref(brandId), currencyId }
    ],
    withAccessToken: true
  });

  // ---
  const gateways = getRequest<any>({
    url: useUrl(`brands/${unref(brandId)}/gateways`, {
      limit: 0,
      client_id: clientId,
      order: "order",
      "filter[gateway.currencies.id]": currencyId,
      "filter[active]": 1,
      with: ["gateway.gateway_provider", "gateway.card_types"].join()
    }),
    queryKey: [
      "payment-details",
      "gateways",
      { brandId: unref(brandId), clientId, currencyId }
    ],
    withAccessToken: true
  }).then(data => {
    // Allowlist payment gateways if provided
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
            type: GatewayTypes.STORED
          }
        });
      }

      return {
        stored_payment_methods,
        gateways,
        payment_types: PaymentType,
        address
      };
    }
  );
}

async function parse(
  { amount, model, schema, gateways }: PaymentDetailsContext,
  { data }: AnyEventObject
) {
  // ---
  let gateway = null;

  // ---
  // Create a safe model to work with
  const safeModel = useModelParser(
    schema,
    pick(data, ["type", "gateway_id"]),
    model
  );

  // ---
  // HACK: TEMP: FORCE payment type to PAY_IN_FULL
  safeModel.type ??= PaymentType.PAY_IN_FULL;
  // ---
  // Gateway vs. Stored Payment Logic...

  // 1) Make sure if a gateway is selected that we use that
  if (safeModel?.gateway_id) {
    gateway = find(gateways, {
      gateway_id: safeModel.gateway_id
    })?.gateway;
    // if we don't have a matching/valid gateway, then we should remove the gateway_id
    if (!gateway) unset(safeModel, "gateway_id");
  }

  // 2) finally If we don't have any selected gateways, then we should use the first available
  if (!safeModel.gateway_id) {
    gateway = first(gateways)?.gateway;
    safeModel.gateway_id = gateway?.id;
  }

  // 3) Safety Check...if the payment type is pay later or Free, clear the gateway_id
  if (safeModel?.type == PaymentType.PAY_LATER || amount <= 0) {
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
  const errors = schema ? validate(schema, model) : [];

  // ALSO check if any of our actors are in an invalid state
  // NB, wait for them to finish loading/checking before we proceed
  const promises = map(actors, actor => {
    if (!actor) return Promise.resolve();
    return waitFor(
      actor,
      state => !["loading", "checking"].some(state.matches),
      { timeout: 60_000 }
    ).then(state => {
      if (stateMatches(state, ["error", "invalid"]))
        errors.push({
          instancePath: actor.id,
          schemaPath: `actors/${actor.id}`,
          keyword: "actorState",
          params: {},
          message: `${actor.id} is ${state.value}`
        });
    });
  });

  await Promise.all(promises);

  return new Promise((resolve, reject) => {
    if (errors?.length) {
      reject(
        new DetailedError(
          "Payment details validation failed",
          responseCodes.Unprocessable_Entity,
          ErrorOrigin.Headless,
          errors
        )
      );
    } else {
      resolve(model);
    }
  });
}

// -----------------------------------------------------------------------------

export default {
  load,
  parse,
  validate,
  // ---
  isAuthenticated: () => useSession().isAuthenticated()
};
