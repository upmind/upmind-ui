// --- external
import { interpret } from "xstate";

// --- internal
import paymentMachine from "./payment.machine";
export * from "./usePayment";
// --- utils

// --- types
export * from "./types";
import { PaymentArgs, PaymentContext } from "./types";

// -----------------------------------------------------------------------------

export const usePayment = (context: PaymentArgs) => {
  const service = interpret(paymentMachine.withContext(context), {
    devTools: false,
  });

  return {
    service: service.start(),
    getSnapshot: () => service.getSnapshot(),
    // ---
    /**
     *  The PAY event triggers the machine to process the payment, this may result in an offsite redirect
     * @returns void
     */
    pay: () => service?.send({ type: "PAY" }),
    /**
     * Payment machine has a REFRESH event that allows us to update information fro mthe basket/invoice
     * such as currency, address or amount to be paid, etc
     * @param data  - The updated context
     * @returns void
     */
    refresh: (context: PaymentArgs) =>
      service?.send({ type: "REFRESH", data: context }),
  };
};
