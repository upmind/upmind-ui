// --- external
import { assign } from "xstate";

// --- internal

// --- utils
import { parseMinorUnitAmount } from "./utils";
import {
  useValidationParser,
  mapToHeadlessError,
  responseCodes,
  type ErrorObject,
  ErrorOrigin,
  type ResponseError
} from "../../../../utils";
import { isFunction, filter, isString, includes, lowerCase } from "lodash-es";

// --- types
import type { AnyEventObject } from "xstate";
import type { StripeContext } from "./types";

// -----------------------------------------------------------------------------
// override the macine actions to generate the schema, uischema and model

export default {
  updateSdk: ({ sdk, currency }: StripeContext, { data }: AnyEventObject) => {
    if (!isFunction(sdk?.elements?.update) || !isFunction(sdk?.element?.update))
      return; // in case we receive an update before stripe has loaded

    const amount = parseMinorUnitAmount(data?.amount || 0, currency.code);
    if (amount <= 0) return; // NB: Stripe requires a positive amount

    sdk.elements.update({
      amount,
      currency: data?.currency.code.toLowerCase() // NB: MUST be lowercase
    });

    if (data.address) {
      sdk.element.update({
        defaultValues: {
          billingDetails: {
            address: {
              postal_code: data.address?.postcode,
              country: data.address?.country?.code
            }
          }
        }
      });
    }
  },

  setError: assign({
    error: (_context: StripeContext, { data }: AnyEventObject) => {
      const error = mapToHeadlessError(data);
      if (error?.status == responseCodes.Unprocessable_Entity) {
        error.data = useValidationParser(error);
      } else if (error?.data) {
        error.data = filter(
          error.data,
          e => isString(e.title) && !includes(lowerCase(e.title), "element")
        );
      }
      return error;
    }
  }),

  setErrorSDK: assign({
    error: (_context: StripeContext, { data }: AnyEventObject) => {
      // NB: we are invalid if the stripe element status is NOT complete!
      if (!data?.complete) {
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

  cleanupSdk: ({ sdk }: StripeContext) => {
    if (sdk?.element) {
      try {
        sdk.element.destroy();
      } catch {
        // SDK may have already cleaned up internally; cleanup must not throw,
        // as that would abort the surrounding xstate transition mid-flight.
      }
      sdk.element = undefined;
    }
  }
};
