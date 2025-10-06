// --- external
import BraintreeDropin from "braintree-web-drop-in";

// --- internal
import sharedServices from "../services";
import { useLocale, useQuery } from "../../..";

// --- utils
import {
  ErrorOrigin,
  DetailedError,
  responseCodes,
  useValidation
} from "../../../../utils";
import { defaultsDeep, reject } from "lodash-es";

// --- types
import { BraintreeTypes, type BraintreeContext } from "./types";
import type { AnyEventObject } from "xstate";
import type {
  Dropin,
  PaymentMethodOptions,
  paypalCreateOptions,
  PaymentMethodPayload,
  PaymentMethodRequestablePayload
} from "braintree-web-drop-in";
import { parseSettings } from "../utils";
// -----------------------------------------------------------------------------

async function load(context: BraintreeContext, _event: AnyEventObject) {
  const { gateway, amount, currency, orderId, clientId, address, ctx } =
    context;

  if (!gateway)
    return Promise.reject(
      new DetailedError(
        "Gateway not found.",
        responseCodes.Not_Found,
        ErrorOrigin.Headless
      )
    );

  return sharedServices.load(context, _event).then(async config => {
    const { get: getRequest, useUrl } = useQuery();

    const authorization = await getRequest<{
      cancel_url: string;
      gateway_specific: {
        clientToken: string;
      };
      notify_url: string;
      return_url: string;
    }>({
      url: useUrl(`gateway/frontend/${gateway?.id}`, {
        amount: amount ?? 0,
        currency: currency?.code ?? ""
      }),
      queryKey: ["gateway", "frontend", gateway?.id],
      staleTime: "static",
      withAccessToken: true,
      withCurrency: true
    }).then(response => response.gateway_specific.clientToken);

    const settings = parseSettings(gateway);

    if (!authorization) {
      reject(
        new DetailedError(
          "Braintree Client Token not found.",
          responseCodes.Not_Found,
          ErrorOrigin.Headless
        )
      );
    } else {
      return { authorization, ...config, ...settings };
    }
  });
}

async function render(
  {
    authorization,
    paymentUses3DS,
    paymentMethodPayPal,
    amount,
    currency
  }: BraintreeContext,
  { data }: AnyEventObject
) {
  const container = data?.container as HTMLElement;

  const paypal: paypalCreateOptions = defaultsDeep(data?.paypal ?? {}, {
    flow: "vault",
    amount,
    currency: currency.code.toLowerCase(),
    buttonStyle: {
      color: "gold",
      shape: "rect",
      size: "medium"
    }
  });

  if (!authorization || !container) {
    return Promise.reject(
      new DetailedError(
        "Braintree cannot render",
        responseCodes.Not_Found,
        ErrorOrigin.Headless,
        {
          authorization,
          container
        }
      )
    );
  }

  const { locale } = useLocale();

  return BraintreeDropin.create({
    authorization,
    container,
    locale: locale.value,
    ...(paymentUses3DS ? { threeDSecure: true } : {}),
    ...(paymentMethodPayPal ? { paypal } : {})
  }).then(instance => {
    // set up our callback helper to watch for validation
    const validationHelper = (callback: any, onReceiveEvent: any) => {
      const cb = (event?: PaymentMethodRequestablePayload) => {
        callback({ type: "VALIDATE", data: { complete: !!event } });
      };

      instance.on("paymentMethodRequestable", cb);
      instance.on("noPaymentMethodRequestable", cb);

      return () => {
        instance.off("paymentMethodRequestable", cb);
        instance.off("noPaymentMethodRequestable", cb);
      };
    };

    return {
      // NB: if we return the entire instance, we run into issue with our xstate inspector....
      //     So we only pull the methods we need.
      validationHelper,
      braintree: {
        clearSelectedPaymentMethod:
          instance.clearSelectedPaymentMethod.bind(instance),
        isPaymentMethodRequestable:
          instance.isPaymentMethodRequestable.bind(instance),
        requestPaymentMethod: instance.requestPaymentMethod.bind(instance),
        teardown: instance.teardown.bind(instance),
        updateConfiguration: instance.updateConfiguration.bind(instance)
      } as Dropin
    };
  });
}

async function validate(
  { schema, model, braintree }: BraintreeContext,
  { data }: AnyEventObject
) {
  // Get any errors from the Braintree Instance
  if (!braintree)
    return Promise.reject(
      new DetailedError(
        "Braintree instance not found.",
        responseCodes.Not_Found,
        ErrorOrigin.Headless
      )
    );

  // Now validate the model as per normal
  const { validate } = useValidation();

  return new Promise((resolve, reject) => {
    if (!schema) return resolve(model);

    const errors = validate(schema, model) || [];

    // NB: we are invalid if the braintree element status is NOT complete!
    if (!data?.complete) {
      errors.push({
        instancePath: "/payment_method_addition",
        schemaPath: "#/properties/payment_method_addition",
        keyword: "required",
        params: {
          missingProperty: "payment_method_addition"
        },
        message: "Braintree instance is incomplete."
      });
    }

    if (errors?.length) {
      reject(
        new DetailedError(
          "Braintree validation failed",
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
 * @name pay
 * @desc Here we create a new payment detail via the Braintree SDK, and return
 * the payment detail NONCE which we later relay to the BE (when executing
 * payment). We do not need to pass a client secret for flow, as the
 * payment detail is attached to a customer and confirmed server-side.
 */
async function pay({
  gateway,
  braintree,
  paymentUses3DS,
  amount
}: BraintreeContext) {
  if (!braintree)
    return Promise.reject(
      new DetailedError(
        "Braintree instance not found.",
        responseCodes.Not_Found,
        ErrorOrigin.Headless
      )
    );

  const paymentOptions = (
    paymentUses3DS ? { threeDSecure: { amount: `${amount}` } } : {}
  ) as PaymentMethodOptions;

  return braintree
    .requestPaymentMethod(paymentOptions)
    .then((payload: PaymentMethodPayload) => {
      const isCard = payload.type === BraintreeTypes.CARD;

      // additional checks for any 3D Secure challenges
      if (isCard && paymentUses3DS && !payload.liabilityShifted) {
        braintree.clearSelectedPaymentMethod();
        throw new DetailedError(
          "3D Secure challenge failed.",
          responseCodes.Unprocessable_Entity,
          ErrorOrigin.External
        );
      }

      // return our payment detial
      return {
        gateway_id: gateway?.id,
        payment_method_addition: {
          payment_method_nonce: payload.nonce
        }
      };
    });
}

// -----------------------------------------------------------------------------

export default {
  load,
  render,
  parse: sharedServices.parse,
  validate,
  // ---
  pay
};
