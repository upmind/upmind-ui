// --- external
import { unref } from "vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useBrand, useI18n, useQuery, useSession } from "..";

// --- utils
import {
  get,
  find,
  pick,
  unset,
  isEmpty,
  includes,
  isEqual,
  values,
  first,
  has,
  compact,
  size,
  isNil,
  set,
  reject
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
  DEBOUNCE_DELAY
} from "../../utils";
import {
  filterGateways,
  filterPaymentDetails,
  filterPaymentTypes
} from "./utils";
import {
  mapAccountCredit,
  mapPaymentData,
  mapPaymentDetailDetails
} from "./mappers";

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
  type IBrandGateway,
  type IPaymentDetail,
  type IWalletBalance,
  InvoiceStatus
} from "@upmind-automation/types";
import type { QueryKey } from "@tanstack/vue-query";

// -----------------------------------------------------------------------------
const queryKey: QueryKey = ["paymentDetail", "stored"];

export function loadList() {
  const { brandId, currencyId } = useBrand();
  const { meta, clientId } = useSession();

  const { query, useUrl } = useQuery();
  return query<IPaymentDetail[], PaymentDetail[]>({
    queryKey,
    url: useUrl(`clients/${clientId.value}/payment_details`, {
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

    select: mapPaymentDetailDetails,
    staleTime: useTime().HOUR,
    retryDelay: DEBOUNCE_DELAY,
    enabled: () =>
      meta.value.isAuthenticated &&
      !!clientId.value &&
      !!currencyId.value &&
      !!brandId.value
  });
}

// -----------------------------------------------------------------------------

async function loadLookups(
  {
    currency,
    address,
    orderId,
    lookups,
    client,
    paidAmount,
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

  // ---

  const currencyId = currency?.id || defaultCurrencyId.value; // fallback to default currency

  const config = ensureConfig([
    BrandConfigKeys.PARTIAL_PAYMENTS_ENABLED,
    BrandConfigKeys.PAY_LATER_ENABLED,
    BrandConfigKeys.BILLING_GATEWAY_FORCE_CARD_STORAGE,
    BrandConfigKeys.BILLING_GATEWAY_FORCE_AUTO_PAYMENT
  ]);

  const accountCredit: Promise<AccountCredit> = getRequest<
    IWalletBalance,
    AccountCredit
  >({
    url: useUrl(`wallet/balance`),
    queryKey: [
      "wallet-balance",
      {
        brandId: unref(brandId),
        clientId: client.id,
        currencyId
      }
    ],
    select: data => mapAccountCredit(data, currency.code),
    withAccessToken: true,
    withCurrency: true
  }).then(account => {
    // bail if there is no account credit
    if (isEmpty(compact([account.owned.value, account.credit.value])))
      return account;

    // we need to calculate the total account credit including negative allowance
    // and get a formatted version based on the currency
    return post({
      mutationKey: ["wallet", "calculate"],
      url: useUrl("cart/calculate", {}),
      withAccessToken: true,
      data: {
        currency_id: currencyId,
        prices: compact([account.owned.value, account.credit.value])
      }
    })
      .then(data => {
        account.total.amount = get(data, "total_formatted", "");
        account.total.value = get(data, "total", 0);
        return account;
      })
      .catch(() => {
        // if we fail to get the formatted total, we just return the account without it
        return account;
      });
  });

  const storedPaymentMethods: Promise<PaymentDetail[]> = getRequest<
    IPaymentDetail[],
    PaymentDetail[]
  >({
    url: useUrl(`clients/${client.id}/payment_details`, {
      limit: 0,
      brand_id: unref(brandId),
      active: true,
      "filter[gateway.currencies.id]": currencyId,
      // "filter[gateway.active]": 1,
      order: ["-default", "id"].join(),
      with: ["gateway", "client"].join()
    }),
    queryKey: [
      "payment-details",
      {
        orderId,
        brandId: unref(brandId),
        clientId: client.id,
        currencyId,
        addressId: address?.country_id
      }
    ],
    withAccessToken: true,
    select: mapPaymentDetailDetails
  });

  // ---
  const gateways: any = getRequest<IBrandGateway[]>({
    url: useUrl(`brands/${unref(brandId)}/gateways`, {
      limit: 0,
      client_id: client.id,
      invoice_id: orderId,
      order: "order",
      "filter[gateway.currencies.id]": currencyId,
      "filter[active]": 1,
      with: ["gateway.gateway_provider", "gateway.card_types"].join()
    }),
    queryKey: [
      "payment-details",
      "gateways",
      {
        brandId: unref(brandId),
        invoice_id: orderId,
        clientId: client.id,
        currencyId,
        invoiceId: orderId,
        addressId: address?.country_id
      }
    ],
    withAccessToken: true
  });

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
    client
  } = context;
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
  const safeAmount = amountPartial ? Math.min(amountPartial, amount) : amount;
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
    safeModel.amount = amount;
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
  const needsPayment =
    !!safeModel!.amount &&
    !isEqual(safeModel!.amount, safeModel!.wallet_amount) &&
    includes(
      [PaymentType.PARTIAL_PAYMENT, PaymentType.PAY_IN_FULL],
      safeModel?.type
    );

  if (needsPayment) {
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
        lookups
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

  // Finally we calculate the formatted amount for the model amount
  // NB: Only fire these if the amounts have changed
  lookups.amountsFormatted = await Promise.all([
    calculate(context, {
      data: {
        value: safeModel.amount ?? 0,
        prev: model?.amount ?? 0,
        force: isEmpty(lookups.amountsFormatted?.amount)
      },
      type: "calculate"
    }).catch(() => {
      return lookups.amountsFormatted?.amount || "";
    }),
    calculate(context, {
      data: {
        value: amount,
        prev: lookups.amountsFormatted?.outstanding ?? 0,
        force: isEmpty(lookups.amountsFormatted?.outstanding)
      },
      type: "calculate"
    }).catch(() => lookups.amountsFormatted?.outstanding || ""),
    calculate(context, {
      data: {
        value: safeModel.wallet_amount ?? 0,
        prev: model?.wallet_amount ?? 0,
        force: isEmpty(lookups.amountsFormatted?.wallet)
      },
      type: "calculate"
    }).catch(() => lookups.amountsFormatted?.wallet || "")
  ]).then(([amountFormatted, outstandingFormatted, walletAmountFormatted]) => {
    return {
      amount: amountFormatted,
      outstanding: outstandingFormatted,
      wallet: walletAmountFormatted
    };
  });

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

async function calculate(
  { currency }: PaymentDetailsContext,
  { data }: AnyEventObject
) {
  const { post, useUrl } = useQuery();
  const prices = reject([data.value], isNil);
  if (!data.force && (isEqual(data.value, data.prev) || isEmpty(prices))) {
    return Promise.reject();
  }

  // we need to calculate the total account credit including negative allowance
  // and get a formatted version based on the currency
  return post({
    mutationKey: ["wallet", "calculate"],
    url: useUrl("cart/calculate", {}),
    withAccessToken: true,
    data: {
      currency_id: currency.id,
      prices
    }
  }).then(res => get(res, "total_formatted", ""));
}
// -----------------------------------------------------------------------------

export default {
  loadLookups,
  parse,
  validate,
  // ---
  isAuthenticated: () => useSession().isAuthenticated()
};
