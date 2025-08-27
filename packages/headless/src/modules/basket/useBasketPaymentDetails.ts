// --- external

// --- internal
import { useBasket } from "./";

// --- utils

// --- types
import { PaymentDetailModel } from "../paymentDetails/types";
import { usePaymentDetail } from "../paymentDetails";

// -----------------------------------------------------------------------------
// We allow an actor to be passed in, but if not, we will use the basket service and wait for the 'actor'' machine to be ready

export const useBasketPaymentDetails = () => {
  const { actors } = useBasket();
  const actor = actors.paymentDetails;

  return usePaymentDetail(actor);
};
