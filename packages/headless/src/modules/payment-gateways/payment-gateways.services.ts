/** @internal */
import {
  BrandConfigKeys,
  GatewayContext as GatewayCtx
} from "@upmind-automation/types";
import { useBrand } from "../brand";
import { useQuery } from "../query";
import { useActiveSession } from "../session-store";
import { useI18n } from "../system-localisation";
import { canBeStored } from "./payment-gateways.utils";
import {
  DetailedError,
  ErrorOrigin,
  responseCodes,
  useModelParser,
  useValidation
} from "../../utils";
import { get, isNil } from "lodash-es";
import type { GatewayContext } from "./payment-gateways.types";
import type { AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------

async function load(
  { gateway, supported, ctx }: GatewayContext,
  _event: AnyEventObject
) {
  const { isReady: sessionReady } = useActiveSession().useActions();

  await sessionReady().catch(error => Promise.reject(error));

  const { isReady: brandReady, ensureConfig } = useBrand();

  await brandReady().catch(error => Promise.reject(error));

  // --- reject early if ADD context and gateway cannot store outside payment
  if (ctx === GatewayCtx.ADD && !canBeStored(gateway)) {
    const { t } = useI18n();
    throw new DetailedError(
      t("error.payment_gateway_not_available"),
      responseCodes.Unprocessable_Entity,
      ErrorOrigin.Headless
    );
  }

  // ---
  // check our brand for what to do with card storage and auto payment

  return ensureConfig([
    BrandConfigKeys.BILLING_GATEWAY_FORCE_CARD_STORAGE,
    BrandConfigKeys.BILLING_GATEWAY_FORCE_AUTO_PAYMENT
  ]).then(data => {
    const config = {
      canStore: supported ? canBeStored(gateway) : false,
      mustStore: supported
        ? get(
            data,
            BrandConfigKeys.BILLING_GATEWAY_FORCE_CARD_STORAGE,
            gateway?.store_on_payment_force || false
          )
        : false,
      mustAutoPay: supported
        ? get(data, BrandConfigKeys.BILLING_GATEWAY_FORCE_AUTO_PAYMENT, false)
        : false
    };
    return config;
  });
}

async function parse(
  {
    schema,
    model,
    canStore,
    mustStore,
    mustAutoPay,
    supported
  }: GatewayContext,
  _event: AnyEventObject
) {
  model = useModelParser(schema, model);
  // Honour the brand settings storage and auto payment
  if (!canStore) {
    model.store_on_payment = false;
    model.store_on_payment_auto_payment = false;
  } else {
    if (mustStore) model.store_on_payment = true;
    if (mustAutoPay) model.store_on_payment_auto_payment = true;
  }

  // If we are not storing, we should not allow auto payment
  if (
    !supported ||
    (!isNil(model.store_on_payment) && !model.store_on_payment)
  ) {
    model.store_on_payment_auto_payment = false;
  }

  return Promise.resolve(model);
}

async function validate(
  { schema, model }: GatewayContext,
  _event: AnyEventObject
) {
  // ---
  const { t } = useI18n();
  // Now validate the model as per normal
  const { validate } = useValidation();

  return new Promise((resolve, reject) => {
    if (!schema) return resolve(model);
    const errors = validate(schema, model);
    if (errors?.length) {
      reject(
        new DetailedError(
          t("error.payment_gateway_validation_failed"),
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

/**
 * @name getPaymentData
 * @desc Here we create a new payment detail via the Card SDK, and return
 * the payment detail ID which we later relay to the BE (when executing
 * payment). We do not need to pass a client secret for flow, as the
 * payment detail is attached to a customer and confirmed server-side.
 */
async function pay({ model }: GatewayContext) {
  return Promise.resolve(model);
}

/**
 * @name beginSetup
 * @description Calls the tokenize-begin API to initiate storing a payment method.
 * Returns gateway_specific data (e.g. clientSecret for Stripe, clientToken for Braintree)
 * and the client_payment_details_id needed for endSetup.
 */
export async function beginSetup({ gateway, client }: GatewayContext) {
  const { t } = useI18n();
  const { post, useUrl } = useQuery();

  if (!gateway?.id || !client?.id) {
    throw new DetailedError(
      t("error.payment_gateway_not_available"),
      responseCodes.Bad_Request,
      ErrorOrigin.Headless
    );
  }

  return post({
    mutationKey: ["gateway", "tokenize-begin", gateway.id],
    url: useUrl(`gateway/frontend/tokenize-begin/${gateway.id}`),
    withAccessToken: true,
    data: {
      client_id: client.id,
      gateway_id: gateway.id
    }
  });
}

/**
 * @name endSetup
 * @description Calls the tokenize-end API to finalize storing a payment method.
 * Requires the client_payment_details_id from beginSetup and a gateway-specific
 * token (nonce, payment_method_id, etc.) from the SDK.
 */
export async function endSetup(
  { gateway, client, model }: GatewayContext,
  payload: {
    client_payment_details_id: string;
    token?: string;
    payment_method_nonce?: string;
    payment_method_id?: string;
    payment_method_type?: string;
    [key: string]: unknown;
  }
) {
  const { t } = useI18n();
  const { post, useUrl } = useQuery();

  if (!gateway?.id || !client?.id) {
    throw new DetailedError(
      t("error.payment_gateway_not_available"),
      responseCodes.Bad_Request,
      ErrorOrigin.Headless
    );
  }

  return post({
    mutationKey: ["gateway", "tokenize-end", gateway.id],
    url: useUrl(`gateway/frontend/tokenize-end/${gateway.id}`),
    withAccessToken: true,
    data: {
      auto_payment: model?.store_on_payment_auto_payment ?? false,
      client_id: client.id,
      ...payload
    }
  });
}

/**
 * @name add
 * @description Default add service for non-SDK gateways.
 * Calls beginSetup → endSetup without SDK token acquisition.
 * SDK gateways (Stripe, Braintree, etc.) override this with their own
 * implementation that acquires a token between the two API calls.
 */
async function add(context: GatewayContext) {
  const { t } = useI18n();
  const { gateway } = context;

  if (!gateway) {
    throw new DetailedError(
      t("error.payment_gateway_not_available"),
      responseCodes.Not_Found,
      ErrorOrigin.Headless
    );
  }

  if (!canBeStored(gateway)) {
    throw new DetailedError(
      t("error.payment_gateway_not_available"),
      responseCodes.Unprocessable_Entity,
      ErrorOrigin.Headless
    );
  }

  const setupResponse = await beginSetup(context);
  const clientPaymentDetailsId = get(
    setupResponse,
    "client_payment_details.id"
  );

  if (!clientPaymentDetailsId) {
    throw new DetailedError(
      t("error.payment_gateway_not_available"),
      responseCodes.Unprocessable_Entity,
      ErrorOrigin.Headless
    );
  }

  return {
    gatewayId: gateway.id,
    data: {
      client_payment_details_id: clientPaymentDetailsId
    }
  };
}

// -----------------------------------------------------------------------------

export default {
  load,
  parse,
  validate,
  // ---
  pay,
  add
};
