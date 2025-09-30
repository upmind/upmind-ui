// --- external
import { unref } from "vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useBrand, useI18n, useQuery, useSession } from "..";

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
  stateMatches,
  useTime
} from "../../utils";

// --- types
import { GatewayTypesExtended } from "./gateways/types";
import type { AnyEventObject } from "xstate";
import type { PaymentDetail, PaymentDetailsContext } from "./types";
import {
  BrandConfigKeys,
  IPaymentDetail,
  PaymentType
} from "@upmind-automation/types";
import { QueryKey } from "@tanstack/vue-query";
import { mapPaymentDetailDetails } from "./mappers";

// -----------------------------------------------------------------------------
const queryKey: QueryKey = ["paymentDetails", "stored"];

export function loadList() {
  const { brandId, currencyId } = useBrand();
  const { meta, userId } = useSession();

  const clientId = userId.value;

  const { query, useUrl } = useQuery();

  return query<IPaymentDetail[], PaymentDetail[]>({
    queryKey,
    url: useUrl(`clients/${clientId}/payment_details`, {
      limit: 0,
      brand_id: brandId.value,
      active: true,
      "filter[gateway.currencies.id]": currencyId.value,
      order: ["-default", "id"].join(),
      with: ["gateway", "client"].join()
    }),
    withAccessToken: true,
    withCurrency: true,
    // --- options
    guard: async () =>
      new Promise((resolve, reject) => {
        if (
          meta.value.isAuthenticated &&
          !!userId.value &&
          !!currencyId.value &&
          !!brandId.value
        ) {
          resolve(true);
        } else {
          const error = !meta.value.isAuthenticated
            ? new NotAuthenticatedError()
            : new DetailedError(
                "Load Payment details failed: Brand or Currency not provided",
                responseCodes.No_Content,
                ErrorOrigin.Headless,
                {
                  currencyId: currencyId.value,
                  brandId: brandId.value
                }
              );

          reject(error);
        }
      }),
    select: mapPaymentDetailDetails,
    staleTime: useTime().HOUR
  });
}

// -----------------------------------------------------------------------------

async function loadLookups(
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

  const storedPaymentMethods = getRequest<any>({
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
  }).then(data => sortBy(data, ["order"]));
  // ----

  return Promise.all([storedPaymentMethods, gateways, address]).then(
    ([storedPaymentMethods, gateways, address]) => {
      // ensure we only show active stored payment methods
      storedPaymentMethods = filter(storedPaymentMethods, "active");

      // If we have stored payment methods, then we MUSt add a 'gateway' for them
      if (storedPaymentMethods?.length) {
        gateways.unshift({
          gateway_id: "stored",
          gateway: {
            id: "stored",
            name: "Pay with an existing method",
            type: GatewayTypesExtended.STORED
          }
        });
      }

      return {
        storedPaymentMethods,
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
  const { t } = useI18n();
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
      state =>
        !["loading", "available.checking", "available.rendering"].some(
          state.matches
        ),
      { timeout: 60_000 }
    ).then(state => {
      if (
        stateMatches(state, [
          "unavailable",
          "available.error",
          "available.invalid"
        ])
      )
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
          t("error.payment_details_validation_failed"),
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
  loadLookups,
  parse,
  validate,
  // ---
  isAuthenticated: () => useSession().isAuthenticated()
};
