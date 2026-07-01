import {
  type IPaymentDetail,
  PaymentMethodType
} from "@upmind-automation/types";
import { useQuery } from "../../query";
import sharedServices from "../payment-gateways.services";
import { generateResponseUrls } from "../payment-gateways.utils";
import type { GatewayCardContext } from "./types";

// --- utils

// --- types

// -----------------------------------------------------------------------------

/**
 * @name getPaymentData
 * @desc Here we create a new payment detail via the Card SDK, and return
 * the payment detail ID which we later relay to the BE (when executing
 * payment). We do not need to pass a client secret for flow, as the
 * payment detail is attached to a customer and confirmed server-side.
 */
async function pay({ model, client }: GatewayCardContext) {
  if (model.store) {
    return storePaymentMethod({
      model,
      client
    } as GatewayCardContext)
      .then((result: IPaymentDetail) => {
        return {
          payment_details_id: result.id
        };
      })
      .catch(err => {
        console.error("Error storing payment method:", err);
        throw err;
      });
  }

  return Promise.resolve(model);
}

async function storePaymentMethod({
  model,
  client,
  orderId
}: GatewayCardContext): Promise<IPaymentDetail> {
  const currentUrl = new URL(window.location.href);

  const { returnUrl } = generateResponseUrls(
    currentUrl, // ensure we come back to where we were
    {
      orderId,
      type: PaymentMethodType.GATEWAY_CARD,
      autoPay: model.auto_payment
    }
  );

  const { post, useUrl } = useQuery();

  // TODO: correct Typing
  return post<IPaymentDetail>({
    mutationKey: ["clients", client.id, "payment_details"],
    url: useUrl(`clients/${client.id}/payment_details`),
    data: {
      card_type: model.card_type,
      card_num: model.card_num,
      card_expire_date: model.card_expire_date,
      card_cvv: model.card_cvv,
      name: model.name,
      address_id: model.address_id,
      gateway_id: model.gateway_id,
      cardholder_name: model.cardholder_name,
      return_url: returnUrl,
      auto_payment: model?.auto_payment
    },
    withAccessToken: true
  }).then(result => {
    const _scaVerified = result?.sca_verified;
    const _nextAction = result?.next_action;
    // DC: What does this do?
    // if (nextAction && !scaVerified) {
    //   ;
    //   return {
    //     ...nextAction,
    //     returnLocation: currentUrl.toString()
    //   };
    // }

    return result;
  });
}

// -----------------------------------------------------------------------------

export default {
  ...sharedServices,
  pay
};
