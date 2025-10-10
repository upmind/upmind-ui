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
  first,
  unset,
  filter,
  sortBy,
  isEmpty,
  includes
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
  IBrandGateway,
  IGateway,
  IPaymentDetail,
  PaymentType
} from "@upmind-automation/types";
import { QueryKey } from "@tanstack/vue-query";
import { mapPaymentDetailDetails } from "./mappers";
import { generateResponseUrls } from "./gateways/utils";

// -----------------------------------------------------------------------------
const queryKey: QueryKey = ["paymentDetail", "stored"];

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

const supportedGateways = [
  "Offline",
  "BankTransfer",
  "Stripe_PaymentIntents",
  "PayPal_Express",
  "PayPal_Pro",
  "PayPal_BillingAgreement",
  "Micropayment",
  "Flutterwave",
  "Paystack"
];

async function loadLookups(
  { currency, address, orderId }: PaymentDetailsContext,
  _event: AnyEventObject
) {
  const { meta, user } = useSession();
  const paymentTypes = { ...PaymentType };

  if (!meta.value.isAuthenticated || !user.value?.id)
    throw new NotAuthenticatedError();

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

  const storedPaymentMethods: Promise<PaymentDetail[]> = getRequest<
    IPaymentDetail[],
    PaymentDetail[]
  >({
    url: useUrl(`clients/${clientId}/payment_details`, {
      limit: 0,
      brand_id: unref(brandId),
      active: true,
      "filter[gateway.currencies.id]": currencyId,
      order: ["-default", "id"].join(),
      with: ["gateway", "client"].join()
      // "filter[active]": 1,
    }),
    queryKey: [
      "payment-details",
      {
        brandId: unref(brandId),
        clientId,
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
      client_id: clientId,
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
        clientId,
        currencyId,
        invoiceId: orderId,
        addressId: address?.country_id
      }
    ],
    withAccessToken: true
  })
    // Whitelist certain payment gateways until we have full support for all
    .then(data => {
      if (supportedGateways.length)
        return filter(data, ({ gateway }) =>
          includes(supportedGateways, gateway.gateway_provider.code)
        );

      return data;
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
        unset(paymentTypes, PaymentType.PAY_LATER); // Allowlist payment gateways if provided

      return {
        storedPaymentMethods: filter(storedPaymentMethods, "meta.isActive"), // ensure we only show active stored payment methods
        gateways: sortBy(gateways, ["order"]),
        paymentTypes
      } as unknown as Partial<PaymentDetailsContext>;
    }
  );
}

async function parse(
  {
    orderId,
    amount,
    model,
    schema,
    gateways,
    storedPaymentMethods,
    address,
    clientId
  }: PaymentDetailsContext,
  { data }: AnyEventObject
) {
  // ---
  let paymentDetail = undefined;

  // ---
  // Create a safe model to work with
  const safeModel = useModelParser<PaymentDetailModel>(
    schema,
    pick(data, [
      "type",
      "gateway_id",
      "payment_details_id",
      "return_url",
      "cancel_url"
    ]),
    model,
    {
      allowExtraProps: false
    }
  );

  // ---
  // FORCE payment type to PAY_IN_FULL if its not set
  safeModel.type ??= PaymentType.PAY_IN_FULL;
  // ---
  // 1) Make sure if a gateway is selected that we use that
  if (safeModel?.gateway_id) {
    const brandGateway = find(gateways, ["gateway_id", safeModel.gateway_id]);
    // if we don't have a matching/valid gateway, then we should remove the gateway_id
    if (!brandGateway) {
      unset(safeModel, "gateway_id");
    } else {
      unset(safeModel, "payment_details_id");
    }
  }

  // 2) finally If we don't have any selected gateways, then we should use the first available
  if (!safeModel?.gateway_id) {
    if (isEmpty(storedPaymentMethods)) {
      safeModel.gateway_id = first(gateways)?.gateway_id;
      safeModel.payment_details_id = undefined; // we can't use a stored payment method if we're using a gateway
    } else {
      safeModel.payment_details_id ??= first(storedPaymentMethods)?.id;
    }
  }

  // 3) If we're using a stored payment method, then we should use that and clear the gateway_id
  if (safeModel?.payment_details_id) {
    unset(safeModel, "gateway_id");
    paymentDetail = {
      data: {
        payment_details_id: safeModel.payment_details_id
      }
    };
  } else {
    paymentDetail = undefined;
  }

  // 4) Safety Check...if the payment type is pay later or Free, clear the gateway_id
  if (safeModel?.type == PaymentType.PAY_LATER || amount <= 0) {
    unset(safeModel, "gateway_id");
    unset(safeModel, "payment_details_id");
  }

  // NB:as a final check... if we have no gateways or stored payment methods, then we should force the type to pay later
  // this will allow the order to be placed without any payment details
  if (isEmpty(gateways)) {
    unset(safeModel, "gateway_id");
    unset(safeModel, "payment_details_id");
    safeModel.type = PaymentType.PAY_LATER;

    paymentDetail = {
      type: PaymentType.PAY_LATER,
      amount,
      address_id: address?.id,
      client_id: clientId
    };
  }

  // genrate our return and cancel urls
  const { cancelUrl, returnUrl } = generateResponseUrls(
    new URL(`order/${orderId}`, window.location.origin),
    { orderId }
  );

  safeModel.cancel_url = cancelUrl;
  safeModel.return_url = returnUrl;

  return { model: safeModel, paymentDetail };
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

// -----------------------------------------------------------------------------

export default {
  loadLookups,
  parse,
  validate,
  // ---
  isAuthenticated: () => useSession().isAuthenticated()
};
