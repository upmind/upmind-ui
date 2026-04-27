// --- external

// --- internal

// --- utils
import { isFunction } from "lodash-es";

// --- types
import { assign, type AnyEventObject } from "xstate";
import type { BraintreeContext } from "./types";
import {
  responseCodes,
  type ErrorObject,
  ErrorOrigin,
  type ResponseError
} from "../../../../utils";
// -----------------------------------------------------------------------------
// override the macine actions to generate the schema, uischema and model

export default {
  updateSdk: (
    { sdk, currency, paymentMethodPayPal }: BraintreeContext,
    { data }: AnyEventObject
  ) => {
    if (!isFunction(sdk?.braintree?.updateConfiguration)) return; // in case we receive an update before braintree has loaded

    const amount = data?.amount;
    if (amount <= 0) return; // NB: Braintree requires a positive amount

    if (paymentMethodPayPal) {
      sdk.braintree.updateConfiguration("paypal", "amount", amount);
      sdk.braintree.updateConfiguration(
        "paypal",
        "currency",
        data?.currency?.code.toLowerCase() ?? currency?.code.toLowerCase()
      );
    }
  },
  setErrorSDK: assign({
    error: (_context: BraintreeContext, { data }: AnyEventObject) => {
      // NB: we are invalid if the stripe element status is NOT complete!
      if (!data?.valid) {
        return {
          data: [
            {
              instancePath: "/payment_method_addition",
              schemaPath: "#/properties/payment_method_addition",
              keyword: "required",
              params: {
                missingProperty: "payment_method_addition"
              }
            }
          ] as ErrorObject[],
          origin: ErrorOrigin.External,
          code: responseCodes.Unprocessable_Entity
        } as ResponseError;
      }

      return undefined;
    }
  }),

  cleanupSdk: ({ sdk }: BraintreeContext) => {
    if (sdk?.braintree) {
      try {
        sdk.braintree.teardown?.();
      } catch {
        // SDK may have already cleaned up internally; cleanup must not throw,
        // as that would abort the surrounding xstate transition mid-flight.
      }
      sdk.braintree = undefined;
    }
  }
};
