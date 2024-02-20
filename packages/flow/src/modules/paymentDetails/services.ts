// --- external

// --- internal
import { useApi, useSession, useBrand, BrandConfigKeys } from "..";
const { authSubscription, isAuthenticated } = useSession();

// --- utils
import { useValidation } from "../../utils";
import { useInvoiceParser } from "./utils";
import { unset, get, sortBy } from "lodash-es";

// --- types
import type { PaymentDetailsEvent, PaymentDetailsContext } from "./types";

// --------------------------------------------------------
// ENUMS

export enum PaymentTypes {
  PAY_IN_FULL = "stored-card",
  PARTIAL_PAYMENT = "partial-payment",
  PAY_LATER = "pay-later"
  // MANUAL_PAYMENT = "manual-payment" // only admi s can do this and we dont support it...YET
}

export enum GatewayTypes {
  CARD = 1,
  BANK_TRANSFER = 2,
  DIRECT_DEBIT = 3,
  SEPA = 4,
  OFFLINE = 5,
  MOBILE = 6,
  WALLET = 7
}

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

async function load(
  { currency_id }: PaymentDetailsContext,
  _event: PaymentDetailsEvent
) {
  const { getBrandId, getCurrencyId, isReady, getConfig } = useBrand();
  const { get: getRequest, useUrl } = useApi();
  const { getUserId } = useSession();

  await isReady();

  // ---

  const client_id = await getUserId();
  const brand_id = getBrandId();
  currency_id ??= getCurrencyId();

  // ---
  // checkif our brand allows or restricts certain payment types
  await getConfig([
    BrandConfigKeys.PARTIAL_PAYMENTS_ENABLED,
    BrandConfigKeys.PAY_LATER_ENABLED
  ]).then(data => {
    if (!get(data, BrandConfigKeys.PARTIAL_PAYMENTS_ENABLED))
      unset(PaymentTypes, "PARTIAL_PAYMENT");

    if (!get(data, BrandConfigKeys.PAY_LATER_ENABLED))
      unset(PaymentTypes, "PAY_LATER");
  });

  // ---

  const balance = getRequest({
    url: useUrl(`wallet/balance`, {
      currency_id
      // with_staged_imports=1
    }),
    withAccessToken: true,
    useCache: false
  }).then(({ data }) => data);

  // ---

  const payment_details = getRequest({
    url: useUrl(`clients/${client_id}/payment_details`, {
      limit: 0,
      brand_id,
      "filter[gateway.currencies.id]": currency_id,
      order: ["-default", "id"].join(),
      with: ["gateway", "client"].join()
      // with_staged_imports: 1
    }),
    withAccessToken: true,
    useCache: false
  }).then(({ data }) => data);

  // ---

  const gateways = getRequest({
    url: useUrl(`brands/${brand_id}/gateways`, {
      limit: 0,
      client_id,
      order: "order",
      "filter[gateway.currencies.id]": currency_id,
      "filter:[active]": 1,
      with: ["gateway.gateway_provider", "gateway.card_types"].join()
    }),
    withAccessToken: true,
    useCache: false
  }).then(({ data }) => sortBy(data, ["order"]));

  // ----

  return Promise.all([balance, payment_details, gateways]).then(
    ([balance, payment_details, gateways]) => ({
      balance,
      payment_details,
      gateways,
      payment_types: PaymentTypes
    })
  );
}

// --------------------------------------------------------

async function parse(
  { model }: PaymentDetailsContext,
  _event: PaymentDetailsEvent
) {
  // ---

  // ensure we dont send the gateway_id if the payment type is pay later
  if (model?.type == PaymentTypes.PAY_LATER) {
    unset(model, "gateway_id");
  }

  return Promise.resolve({ model });
}

async function validate(
  { schema, model }: PaymentDetailsContext,
  _event: PaymentDetailsEvent
) {
  // ---

  // Now validate the model as per normal
  const { validate } = useValidation();

  return new Promise((resolve, reject) => {
    const errors = validate(schema, model);
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
  isAuthenticated
};
