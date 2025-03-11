// --- external
import { interpret } from "xstate";

// --- internal
import paymentDetailsMachine from "./paymentDetails.machine";

// --- utils
import { get, isEqual } from "lodash-es";

// --- types
export * from "./types";
export * from "./gateways/types";
import { PaymentDetailsContext } from "./types";
import {
  IAddress,
  IClient,
  ICurrency,
  IInvoice,
} from "@upmind-automation/types";

// -----------------------------------------------------------------------------

export const usePaymentDetails = ({
  invoiceId,
  currency,
  address,
  clientId,
  amount,
}: {
  invoiceId: IInvoice["id"];
  clientId: IClient["id"];
  currency: ICurrency;
  amount: number;
  address?: IAddress;
}) => {
  const service = interpret(
    paymentDetailsMachine.withContext({
      id: invoiceId,
      currency,
      clientId,
      model: {
        amount,
      },
      address,
    } as PaymentDetailsContext),
    { devTools: true }
  );

  return {
    service: service.start(),
    getSnapshot: () => service.getSnapshot(),
    // ---
    clear: () => service?.send({ type: "CLEAR" }),
    input: (model: any) => service?.send({ type: "SET", data: model }),
    update(model: any) {
      if (!model) return;

      // first check if our paymentDetails has change, ie: model.code has changed
      const selected = get(service.getSnapshot(), "context.model");

      // if it has not then bail
      if (!isEqual(selected, model)) {
        // if it has then send the new model to the machine
        service?.send({ type: "SET", data: model, update: true });
      }
    },
  };
};
