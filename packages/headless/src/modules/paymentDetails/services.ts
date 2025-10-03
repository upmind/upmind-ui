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
  isEmpty
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
import type { AnyEventObject } from "xstate";
import type {
  PaymentDetail,
  PaymentDetailModel,
  PaymentDetailsContext
} from "./types";
import {
  BrandConfigKeys,
  IAddress,
  IGateway,
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
  const paymentTypes = { ...PaymentType };

  if (!meta.value.isAuthenticated || !user.value?.id) {
    return Promise.reject(new NotAuthenticatedError());
  }

  const { brandId, currencyId: defaultCurrencyId, ensureConfig } = useBrand();
  const { get: getRequest, useUrl } = useQuery();

  // ---

  const clientId = user.value!.id;
  const currencyId = currency?.id || defaultCurrencyId.value; // fallback to default currency

  const config = ensureConfig([
    BrandConfigKeys.PARTIAL_PAYMENTS_ENABLED,
    BrandConfigKeys.PAY_LATER_ENABLED,
    BrandConfigKeys.BILLING_GATEWAY_FORCE_CARD_STORAGE,
    BrandConfigKeys.BILLING_GATEWAY_FORCE_AUTO_PAYMENT
  ]);

  const storedPaymentMethods = getRequest<IPaymentDetail[], PaymentDetail[]>({
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
    withAccessToken: true,
    select: mapPaymentDetailDetails
  });

  const gateways = getRequest<IGateway[]>({
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
  });

  // ----

  return Promise.all([config, storedPaymentMethods, gateways]).then(
    ([config, storedPaymentMethods, gateways]: [
      Record<string, any>,
      PaymentDetail[],
      IGateway[]
    ]) => {
      if (!get(config, BrandConfigKeys.PARTIAL_PAYMENTS_ENABLED))
        unset(paymentTypes, PaymentType.PARTIAL_PAYMENT);

      if (!get(config, BrandConfigKeys.PAY_LATER_ENABLED))
        unset(paymentTypes, PaymentType.PAY_LATER);

      debugger;
      return {
        storedPaymentMethods: filter(storedPaymentMethods, "meta.isActive"), // ensure we only show active stored payment methods
        gateways: sortBy(gateways, ["order"]),
        paymentTypes,
        address
      } as unknown as Partial<PaymentDetailsContext>;
    }
  );
}

async function parse(
  {
    amount,
    model,
    schema,
    gateways,
    storedPaymentMethods,
    orderId,
    currency,
    address
  }: PaymentDetailsContext,
  { data }: AnyEventObject
) {
  // ---
  let gateway = null;
  let paymentDetails = null;

  // ---
  // Create a safe model to work with
  const safeModel = useModelParser<PaymentDetailModel>(
    schema,
    pick(data, [
      "type",
      "gatewayId",
      "paymentDetailId",
      "returnUrl",
      "cancelUrl"
    ]),
    model,
    {
      allowExtraProps: false
    }
  );
  debugger;

  // ---
  // HACK: TEMP: FORCE payment type to PAY_IN_FULL
  safeModel.type ??= PaymentType.PAY_IN_FULL;
  // ---

  // 1) Make sure if a gateway is selected that we use that
  if (safeModel?.gatewayId) {
    gateway = find(gateways, ["gateway_id", safeModel.gatewayId])?.gateway;
    // if we don't have a matching/valid gateway, then we should remove the gatewayId
    if (!gateway) {
      unset(safeModel, "gatewayId");
    } else {
      unset(safeModel, "paymentDetailId");
    }
  }

  // 2) finally If we don't have any selected gateways, then we should use the first available
  if (!safeModel?.gatewayId) {
    debugger;
    if (isEmpty(storedPaymentMethods)) {
      gateway = first(gateways)?.gateway;
      safeModel.gatewayId = gateway?.id;
      safeModel.paymentDetailId = undefined; // we can't use a stored payment method if we're using a gateway
    } else {
      safeModel.paymentDetailId ??= first(storedPaymentMethods)?.id;
    }
  }

  // 3) If we're using a stored payment method, then we should use that and clear the gatewayId
  if (safeModel?.paymentDetailId) {
    debugger;
    unset(safeModel, "gatewayId");
    gateway = null;
    paymentDetails = {
      id: safeModel.paymentDetailId,
      type: safeModel.type,
      orderId,
      currency: currency.code,
      amount,
      address: address.id
    };
  } else {
    paymentDetails = undefined;
  }

  // 4) Safety Check...if the payment type is pay later or Free, clear the gatewayId
  if (safeModel?.type == PaymentType.PAY_LATER || amount <= 0) {
    unset(safeModel, "gatewayId");
    unset(safeModel, "paymentDetailId");
    gateway = null;
  }

  debugger;
  return Promise.resolve({ model: safeModel, gateway, paymentDetails });
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
