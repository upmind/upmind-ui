// --- external

// --- internal
import { useBrand, useI18n, useQuery } from "../..";

// --- utils
import { find, isEmpty, isNil, omitBy } from "lodash-es";
import { DetailedError, ErrorOrigin, responseCodes } from "../../utils";

// --- types
import { Methods } from "@upmind-automation/types";
import type {
  GatewayProviderCodes,
  IBrandGateway,
  IInvoice
} from "@upmind-automation/types";
import { type PaymentContext } from "./types";
import type { AnyEventObject } from "xstate";
import { submitViaForm } from "./utils";

// -----------------------------------------------------------------------------

function load(
  { orderId, paymentDetail }: PaymentContext,
  { data }: AnyEventObject
) {
  const { t } = useI18n();
  const { get, useUrl } = useQuery();

  if (!orderId)
    return Promise.reject(
      new DetailedError(
        t("error.order_not_available"),
        responseCodes.Bad_Request,
        ErrorOrigin.Upmind
      )
    );

  const gatewayId = paymentDetail?.gateway_id;
  const { brandId } = useBrand();

  return get<IInvoice>({
    url: useUrl(`invoices/${orderId}`, {
      with: [
        "brand",
        "taxes",
        "client",
        "gateway",
        "gateway.gateway_provider",
        "status",
        "contract",
        "payments",
        "products",
        "promotions",
        "client.tags",
        "products.tags",
        "taxes.tax_tag_data",
        "custom_fields.field",
        "affiliate_commissions",
        "products.product.image",
        "account.affiliate_referral.affiliate_account.account.client"
      ].join()
    }),
    queryKey: ["invoice", { id: orderId }],
    withAccessToken: true
  }).then(rawOrder =>
    get<IBrandGateway[]>({
      url: useUrl(
        `brands/${brandId.value}/gateways`,
        omitBy(
          {
            limit: 0,
            client_id: rawOrder?.client_id,
            invoice_id: orderId,
            country_id: rawOrder?.address?.country_id,
            currency_code: rawOrder?.currency?.code,
            order: "order",
            active: true,
            with: ["gateway.gateway_provider", "gateway.card_types"].join()
          },
          isNil
        )
      ),
      queryKey: [
        "payment-details",
        "gateways",
        {
          orderId,
          brandId: brandId.value,
          clientId: rawOrder?.client_id,
          currencyId: rawOrder?.currency_id,
          countryId: rawOrder?.address?.country_id
        }
      ],
      withAccessToken: true
    }).then(brandGateways => {
      return {
        rawOrder,
        gateway: find(brandGateways, ["gateway_id", gatewayId])?.gateway
      };
    })
  );
}

async function update(
  { paymentDetail, orderId }: PaymentContext,
  _event: AnyEventObject
) {
  // TODO: HANDLE WALLET PAYMENTS
  // if (paymentDetail?.amount) data.amount = paymentDetail?.amount;
  // if (paymentDetail?.walletAmount) {
  //   data.wallet_amount = paymentDetail?.walletAmount;
  //   if (!paymentMethodType) data.amount = data.wallet_amount;
  // }

  const { post, useUrl } = useQuery();

  return post({
    mutationKey: ["payments", orderId],
    url: useUrl(`/payments`),
    data: {
      invoice_id: orderId,
      ...paymentDetail
    },
    withAccessToken: true
  });
}

/**
 * @name render
 * @desc Renders the challenge UI for the current gateway by delegating to the
 * appropriate gateway-specific renderer. The renderer injects into the provided container.
 */
async function render(context: PaymentContext, event: AnyEventObject) {
  const { t } = useI18n();
  const { mapRenderer } = await import("./mappers");

  const gatewayCode = context.gateway?.gateway_provider?.code as
    | GatewayProviderCodes
    | undefined;
  const renderer = gatewayCode ? mapRenderer(gatewayCode) : undefined;

  if (!renderer) {
    return Promise.reject(
      new DetailedError(
        t("error.challenge_renderer_not_available"),
        responseCodes.Not_Found,
        ErrorOrigin.Headless,
        { gatewayCode }
      )
    );
  }

  // Check if this renderer supports the current context
  if (renderer.isSupported && !renderer.isSupported(context)) {
    return Promise.reject(
      new DetailedError(
        t("error.challenge_not_supported"),
        responseCodes.Bad_Request,
        ErrorOrigin.Headless,
        { gatewayCode }
      )
    );
  }

  return renderer.render(context, event);
}

/**
 * @name redirect
 * @desc Here we redirect to an external URL (e.g., Stripe) and intentionally do
 * NOT resolve the function promise, ensuring the payment processing state
 * remains unchanged whilst the page offloads
 */
async function redirect(
  { cancel, approval }: PaymentContext,
  _event: AnyEventObject
) {
  /**
   * Inject aborted state for cases when the user clicks back from the browser;
   * We have no router to handle this, so we need to handle it manually
   */
  if (cancel) window.history.replaceState("", "", cancel?.url);

  if (approval) return submitViaForm(approval);
}

async function validate(
  { paymentDetail }: PaymentContext,
  _event: AnyEventObject
) {
  const { t } = useI18n();

  return new Promise((resolve, reject) => {
    if (isEmpty(paymentDetail)) {
      reject(
        new DetailedError(
          t("error.payment_detail_not_available"),
          responseCodes.Not_Found,
          ErrorOrigin.Headless
        )
      );
    } else {
      resolve({});
    }
  });
}

// -----------------------------------------------------------------------------

export default {
  load,
  update,
  validate,
  redirect,
  render
};
