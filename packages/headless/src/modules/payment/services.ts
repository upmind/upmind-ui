// --- external

// --- internal
import { useI18n, useQuery } from "../..";

// --- utils
import { isEmpty } from "lodash-es";
import { DetailedError, ErrorOrigin, responseCodes } from "../../utils";

// --- types
import { Methods } from "@upmind-automation/types";
import { type PaymentContext } from "./types";
import type { AnyEventObject } from "xstate";
import { submitViaForm } from "./utils";

// -----------------------------------------------------------------------------

async function load({ orderId }: PaymentContext, { data }: AnyEventObject) {
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

  return get({
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
    queryKey: ["invoice", { id: orderId }]
  }).then(data => {
    return { rawOrder: data };
  });
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

  const gatewayCode = (context as any).gateway?.gateway_provider_code;
  const renderer = mapRenderer(gatewayCode);

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
