// --- external

// --- internal

// --- utils
import { isFunction } from "lodash-es";

// --- types
import type { AnyEventObject } from "xstate";
import type { BraintreeContext } from "./types";

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
  }
};
