// --- external
import { unref } from "vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import {
  RequestSortDirection,
  useBrand,
  useI18n,
  useQuery,
  useSession
} from "..";
import { useQueryParams } from "../routing";

// --- utils
import {
  get,
  filter,
  find,
  map,
  pick,
  unset,
  isEmpty,
  includes,
  isEqual,
  values,
  first,
  has,
  size,
  isNil,
  set,
  omitBy
} from "lodash-es";
import {
  ErrorOrigin,
  DetailedError,
  responseCodes,
  useValidation,
  NotAuthenticatedError,
  useModelParser,
  stateMatches,
  useTime,
  useSessionStorage,
  useCalculate,
  DEBOUNCE_DELAY
} from "../../utils";
import { invalidateQueryByKey } from "../query/utils";
import {
  filterGateways,
  filterPaymentDetails,
  filterPaymentTypes,
  needsPayment
} from "./utils";
import { mapAccountCredit, mapPaymentData, mapPaymentDetails } from "./mappers";

// --- types
import type { AnyEventObject } from "xstate";
import type {
  AccountCredit,
  PaymentDetail,
  PaymentDetailModel,
  PaymentDetailsContext
} from "./types";
import {
  PaymentType,
  BrandConfigKeys,
  GatewayContext as GatewayCtx,
  GatewayStoreType,
  QUERY_PARAMS,
  type IBrandGateway,
  type IPaymentDetail,
  type IWalletBalance,
  InvoiceStatus
} from "@upmind-automation/types";
import type { QueryKey } from "@tanstack/vue-query";

// -----------------------------------------------------------------------------
const queryKey: QueryKey = ["paymentDetail", "stored"];

export function loadList() {
  const { brandId } = useBrand();
  const { meta, clientId } = useSession();

  const { query, useUrl } = useQuery();
  return query<IPaymentDetail[], PaymentDetail[]>({
    queryKey,
    url: useUrl(`clients/${clientId.value}/payment_details`, {
      limit: 0,
      brand_id: brandId.value,
      active: true,
      with: ["gateway", "client"].join()
    }),
    sort: [
      [RequestSortDirection.DESC, "default"],
      [RequestSortDirection.ASC, "id"]
    ],
    withAccessToken: true,
    // --- options
    select: mapPaymentDetails,
    staleTime: useTime().HOUR,
    retryDelay: DEBOUNCE_DELAY,
    enabled: () =>
      meta.value.isAuthenticated && !!clientId.value && !!brandId.value
  });
}

// -----------------------------------------------------------------------------

async function loadLookups(
  {
    ctx,
    currency,
    address,
    orderId,
    lookups,
    client,
    orderStatus
  }: PaymentDetailsContext,
  _event: AnyEventObject
) {
  const { meta } = useSession();
  const paymentTypes: Record<string, PaymentType> = {
    ["PAY_IN_FULL"]: PaymentType.PAY_IN_FULL
  };
  if (!meta.value.isAuthenticated || !client?.id)
    throw new NotAuthenticatedError();

  const { brandId, currencyId: defaultCurrencyId, ensureConfig } = useBrand();
  const { get: getRequest, post, useUrl } = useQuery();
  const { calculate } = useCalculate();

  // ---
  const currencyId = currency?.id || defaultCurrencyId.value; // fallback to default currency

  const config = ensureConfig([
    BrandConfigKeys.PARTIAL_PAYMENTS_ENABLED,
    BrandConfigKeys.PAY_LATER_ENABLED,
    BrandConfigKeys.BILLING_GATEWAY_FORCE_CARD_STORAGE,
    BrandConfigKeys.BILLING_GATEWAY_FORCE_AUTO_PAYMENT
  ]);

  const accountCredit = getRequest<IWalletBalance, AccountCredit>({
    url: useUrl(`wallet/balance`),
    queryKey: [
      "wallet-balance",
      {
        brandId: unref(brandId),
        clientId: client.id,
        currencyId
      }
    ],
    select: data => mapAccountCredit(data, currency?.code),
    withAccessToken: true,
    withCurrency: true
  }).then(account => {
    // calculate the total account credit including negative allowance and
    // get a formatted version based on the currency. useCalculate handles
    // nil filtering, empty short-circuit, and caching internally (DD-5).
    // Arrays are always sum-mode (DD-4), so a bare PriceEntry[] returns
    // { total, totalFormatted } for direct mutation.
    return calculate(currencyId, [account.owned.value, account.credit.value])
      .then(({ total, totalFormatted }) => {
        account.total.value = total;
        account.total.amount = totalFormatted;
        return account;
      })
      .catch(() => {
        // if we fail to get the formatted total, we just return the account without it
        return account;
      });
  });

  const storedPaymentMethods = getRequest<IPaymentDetail[], PaymentDetail[]>({
    url: useUrl(
      `clients/${client.id}/payment_details`,
      omitBy(
        {
          limit: 0,
          brand_id: unref(brandId),
          country_id: address?.country_id,
          // "filter[gateway.currencies.id]": currency.id,
          currency_code: currency.code,
          active: true,
          with: ["gateway", "client"].join()
        },
        isNil
      )
    ),
    sort: [
      [RequestSortDirection.DESC, "default"],
      [RequestSortDirection.ASC, "id"]
    ],
    queryKey: [
      "payment-details",
      {
        orderId,
        brandId: unref(brandId),
        clientId: client.id,
        currencyId,
        countryId: address?.country_id
      }
    ],
    withAccessToken: true,
    select: mapPaymentDetails
  });

  // ---
  const gateways = getRequest<IBrandGateway[]>({
    url: useUrl(
      `brands/${unref(brandId)}/gateways`,
      omitBy(
        {
          limit: 0,
          client_id: client.id,
          invoice_id: orderId,
          country_id: address?.country_id,
          // "filter[gateway.currencies.id]": currency.id,
          currency_code: currency?.code,
          active: true,
          with: ["gateway.gateway_provider", "gateway.card_types"].join()
        },
        isNil
      )
    ),
    sort: [[RequestSortDirection.ASC, "order"]],
    queryKey: [
      "payment-details",
      "gateways",
      {
        ctx,
        orderId,
        brandId: unref(brandId),
        clientId: client.id,
        currencyId,
        countryId: address?.country_id
      }
    ],
    withAccessToken: true
  }).then(list =>
    // Guest customers can't use gateways that require a stored payment method
    // — exclude `ALWAYS` store_type. Mirrors vue-app's checkoutProvider.
    client.is_guest
      ? filter(
          list,
          g =>
            g.gateway?.gateway_provider?.store_type !== GatewayStoreType.ALWAYS
        )
      : list
  );

  // ----

  return Promise.all([
    config,
    accountCredit,
    storedPaymentMethods,
    gateways
  ]).then(
    ([config, accountCredit, storedPaymentMethods, gateways]: [
      Record<string, any>,
      AccountCredit,
      PaymentDetail[],
      IBrandGateway[]
    ]) => {
      // NB disable pay later when there we have an actual order and not a Basket (draft = basket)
      if (orderStatus !== InvoiceStatus.DRAFT)
        set(config, BrandConfigKeys.PAY_LATER_ENABLED, false);

      return {
        config,
        accountCredit,
        storedPaymentMethods,
        gateways,
        client,
        amountsFormatted: {
          amount: lookups?.amountsFormatted?.amount || "",
          outstanding: lookups?.amountsFormatted?.outstanding || "",
          wallet: lookups?.amountsFormatted?.wallet || ""
        }
      } as unknown as PaymentDetailsContext["lookups"];
    }
  );
}

async function parse(context: PaymentDetailsContext, { data }: AnyEventObject) {
  const {
    amount,
    amountPartial,
    amountWallet,
    model,
    schema,
    lookups,
    client,
    ctx
  } = context;

  // --- ADD context: simplified parsing (no amounts, no wallet, no payment types)
  if (ctx === GatewayCtx.ADD) {
    const safeData =
      data?.gateway_id !== undefined
        ? { ...model, gateway_id: data.gateway_id }
        : { ...model };

    // Auto-select if single gateway
    if (!safeData.gateway_id && size(lookups.gateways) === 1) {
      safeData.gateway_id = first(lookups.gateways)?.gateway_id;
    }

    // Validate gateway exists in lookups
    if (safeData.gateway_id) {
      const brandGateway = find(lookups.gateways, [
        "gateway_id",
        safeData.gateway_id
      ]);
      if (!brandGateway) {
        delete safeData.gateway_id;
      }
    }

    return { model: safeData };
  }

  // --- PAY context: existing behaviour
  // ---
  let paymentDetail = undefined;
  // ---
  // NB: This parse function can be reached after a refresh from the basket, so we can check for that
  //     we do not want to parse any invalid/unmatched incoming data, as it will wipe out the user selection
  const safeData =
    has(data, "unpaid_amount_converted") || isNil(data)
      ? { ...model } // fallback to the prev model NB: destruct to break accidental mutation
      : pick(data, [
          "type",
          "amount",
          "wallet_amount",
          "payment_details_id",
          "gateway_id",
          "return_url",
          "cancel_url"
        ]);

  // NB: We always want to ensure the model amount/wallet_amount is correct based on the latest basket data
  //     IF a user has set a partial amount, we need to ensure we respect that up to the total amount due
  const safeAmount = amountPartial
    ? Math.min(amountPartial, amount ?? 0)
    : (amount ?? 0);
  safeData.amount = safeAmount;

  // NB: We also need to ensure the wallet amount is not greater than the safe amount or the available wallet balance
  //  IF a user has set a wallet amount, we need to respect that up to the safe amount
  const safeWalletAmount = !isNil(amountWallet)
    ? Math.max(
        0,
        Math.min(
          safeAmount,
          amountWallet,
          lookups.accountCredit?.total.value ?? 0
        )
      )
    : Math.max(
        0,
        Math.min(safeAmount, lookups.accountCredit?.total.value || 0)
      );
  safeData.wallet_amount = safeWalletAmount;

  const safeModel = useModelParser<PaymentDetailModel>(
    schema,
    safeData,
    { ...model },
    {
      allowExtraProps: false
    }
  );

  // ---

  // FORCE payment type if we have the gateway wet to pay later (syntactic sugar)
  if (safeModel?.gateway_id == PaymentType.PAY_LATER) {
    safeModel.type = PaymentType.PAY_LATER;
    safeModel.amount = amount ?? 0;
    unset(safeModel, "gateway_id");
    unset(safeModel, "payment_details_id");
    unset(safeModel, "wallet_amount");
  }

  // NB: Filter our lookups based on the safe model
  lookups.gateways = filterGateways(
    context.raw.gateways ?? [],
    safeModel,
    context.orderStatus
  );
  lookups.storedPaymentMethods = filterPaymentDetails(
    context.raw.storedPaymentMethods ?? [],
    lookups.gateways
  );
  lookups.paymentTypes = filterPaymentTypes(
    context.raw.config ?? {},
    safeModel
  );

  // ---
  // Ensure payment type is valid and allowed, default to PAY_IN_FULL if not
  const allowedTypes = values(lookups.paymentTypes ?? {});
  if (!includes(allowedTypes, safeModel.type))
    safeModel.type = PaymentType.PAY_IN_FULL;

  // FORCE payment methods to none if no payment is needed
  // UNLESS the brand requires a payment method for free orders
  const _needsPayment = needsPayment(
    safeModel!,
    context.requirePaymentForFreeOrders
  );

  if (_needsPayment) {
    // Ensure we have a payment method selected,
    // try preselect the first payment detail if we have one
    // otherwise preselect the first available gateway if there's only one AND PAY_LATER is not an option
    if (!safeModel.gateway_id && !safeModel.payment_details_id) {
      if (!isEmpty(lookups.storedPaymentMethods)) {
        safeModel.payment_details_id =
          find(lookups.storedPaymentMethods, "meta.isDefault")?.id ??
          first(lookups.storedPaymentMethods)?.id;
      } else if (
        size(lookups.gateways) === 1 &&
        !includes(lookups.paymentTypes, PaymentType.PAY_LATER)
      ) {
        safeModel.gateway_id = first(lookups.gateways)?.gateway_id;
      }
    }
  } else {
    unset(safeModel, "gateway_id");
    unset(safeModel, "payment_details_id");
  }

  // --- Handle payment detail data mapping

  // 1) Make sure if a gateway is selected that it is valid
  //    and we set the corresponding gateway
  //    and clear any stored payment method
  //    ALSO check if our payment gateway has been set to Pay Later ( as some syntactic sugar )
  if (safeModel?.gateway_id) {
    const brandGateway = find(lookups.gateways, [
      "gateway_id",
      safeModel.gateway_id
    ]);
    // if we don't have a matching/valid gateway, then we should remove the gateway_id

    if (!brandGateway) {
      unset(safeModel, "gateway_id");
    } else {
      unset(safeModel, "payment_details_id");
    }
  }

  // 2) Make sure if a stored payment method is selected that it is valid
  //    and we set the corresponding payment detail
  //    and clear any gateway selection
  if (safeModel?.payment_details_id) {
    unset(safeModel, "gateway_id");
    const storedPaymentMethod = find(lookups.storedPaymentMethods, [
      "id",
      safeModel.payment_details_id
    ]);
    // if we don't have a matching/valid stored payment method, then we should remove the payment_details_id
    if (!storedPaymentMethod) {
      unset(safeModel, "payment_details_id");
    } else {
      unset(safeModel, "gateway_id");
      paymentDetail = mapPaymentData({
        model: safeModel,
        clientId: client?.id,
        lookups,
        requirePaymentForFreeOrders: context.requirePaymentForFreeOrders
      });
    }
  }

  // NB:as a final check... if we have no gateways or stored payment methods, then we should force the type to pay later
  // this will allow the order to be placed without any payment details
  if (isEmpty(lookups.gateways) && isEmpty(lookups.storedPaymentMethods)) {
    unset(safeModel, "gateway_id");
    unset(safeModel, "payment_details_id");
    safeModel.type = PaymentType.PAY_LATER;
    paymentDetail = undefined;
  }

  return {
    model: safeModel,
    paymentDetail,
    ...lookups
  };
}

async function validate(
  { schema, model, gatewayHelper }: PaymentDetailsContext,
  _event: AnyEventObject
) {
  const { t } = useI18n();
  // Now validate the model as per normal
  const { validate } = useValidation();

  //
  const errors = schema ? validate(schema, model) : [];

  // ALSO check if any of our actors are in an invalid state
  // NB, wait for them to finish loading/checking before we proceed
  return !gatewayHelper
    ? model
    : waitFor(
        gatewayHelper,
        state =>
          !["loading", "rendering", "available.checking"].some(state.matches),
        { timeout: 60_000 }
      ).then(state => {
        if (
          stateMatches(state, [
            "unavailable",
            "available.error",
            "available.invalid"
          ])
        ) {
          errors.push({
            instancePath: gatewayHelper.id,
            schemaPath: `actors/${gatewayHelper.id}`,
            keyword: "actorState",
            params: {},
            message: `${gatewayHelper.id} is ${state.value}`
          });
        }

        if (errors?.length) {
          throw new DetailedError(
            t("error.payment_details_validation_failed"),
            responseCodes.Unprocessable_Entity,
            ErrorOrigin.Headless,
            errors
          );
        } else {
          return model;
        }
      });

  // ---
}

// -----------------------------------------------------------------------------

/**
 * @name restoreOperation
 * @description Reads a pending gateway operation from sessionStorage after an
 * off-site redirect (e.g. 3DS/SCA). Returns the operation data so the
 * finalizing state can call endSetup with it.
 */
async function restoreOperation({ client }: PaymentDetailsContext) {
  const { t } = useI18n();

  const { getParam } = useQueryParams();
  const operationId = getParam(QUERY_PARAMS.OPERATION_ID);

  if (!operationId || !client?.id) {
    throw new DetailedError(
      t("error.payment_gateway_not_available"),
      responseCodes.Not_Found,
      ErrorOrigin.Headless
    );
  }

  const operation = useSessionStorage().get("operation");

  if (!operation?.gatewayId) {
    throw new DetailedError(
      t("error.payment_gateway_not_available"),
      responseCodes.Not_Found,
      ErrorOrigin.Headless
    );
  }

  return operation;
}

/**
 * @name endSetup
 * @description Calls tokenize-end API to finalize storing a payment method.
 * Used by both the normal ADD flow (gateway returns operation data) and the
 * restore flow (operation data read from sessionStorage). Lives at the
 * paymentDetail level — the single place where all ADD flows complete.
 */
async function endSetup({ client, operation }: PaymentDetailsContext) {
  const { post, useUrl } = useQuery();
  const { t } = useI18n();

  if (!operation?.gatewayId || !client?.id) {
    throw new DetailedError(
      t("error.payment_gateway_not_available"),
      responseCodes.Bad_Request,
      ErrorOrigin.Headless
    );
  }

  const { gatewayId, data } = operation as {
    gatewayId: string;
    data: Record<string, unknown>;
  };

  return post({
    mutationKey: ["gateway", "tokenize-end", gatewayId],
    url: useUrl(`gateway/frontend/tokenize-end/${gatewayId}`),
    withAccessToken: true,
    data: {
      client_id: client.id,
      ...data
    }
  })
    .then(invalidateQueryByKey(queryKey))
    .then(response => {
      return response;
    });
}

// -----------------------------------------------------------------------------

export default {
  loadLookups,
  parse,
  validate,
  restoreOperation,
  endSetup,
  // ---
  isAuthenticated: () => useSession().isAuthenticated()
};
