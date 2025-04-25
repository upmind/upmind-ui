// --- external
import { interpret } from "xstate";

// --- internal
import paymentDetailsMachine from "./paymentDetails.machine";

// --- utils

// --- types
export * from "./types";
export * from "./gateways/types";
import { PaymentDetailsArgs, PaymentDetailModel } from "./types";

// -----------------------------------------------------------------------------

export const usePaymentDetails = (context: PaymentDetailsArgs) => {
  const service = interpret(paymentDetailsMachine.withContext(context), {
    devTools: false,
  });

  return {
    service: service.start(),
    getSnapshot: () => service.getSnapshot(),
    // ---
    clear: () => service?.send({ type: "CLEAR" }),
    /**
     * Make changes to the payment details model, such as gateway type, etc
     * This DOES NOT trigger the machine to update the payment details, and needs to be called separately
     * @param model  -  The new model to update
     * @returns void
     */
    input: (model: any) => service?.send({ type: "SET", data: model }),
    /**
     * Update to the payment details model, such as gateway type, etc
     * This automatically triggers the machine to update the payment details
     * @param model  -  The new model to update
     * @returns void
     */
    update(model: PaymentDetailModel) {
      if (!model) return; // maybe throw an error here
      service?.send({ type: "SET", data: model, update: true });
    },
    /**
     *  The checkout event triggers the machine to start the payment process and store it throughthe API
     * @returns
     */
    checkout: () => service?.send({ type: "CHECKOUT" }),
    /**
     * PaymentDetails machine has a REFRESH event that allows us to update information fro mthe basket/invoice
     * such as currency, address or amount to be paid, etc
     * @param data  - The updated context
     * @returns void
     */
    refresh: (context: PaymentDetailsArgs) =>
      service?.send({ type: "REFRESH", data: context }),
  };
};
