// --- external

// --- internal
import { useBasketPaymentDetails } from "./useBasketPaymentDetails";
import { usePaymentGateway } from "../paymentDetails";

// --- utils

// --- types

// -----------------------------------------------------------------------------
// We allow an actor to be passed in, but if not, we will use the basket service and wait for the 'actor'' machine to be ready

export const useBasketPaymentGateway = () => {
  const { gateway: actor } = useBasketPaymentDetails();

  return usePaymentGateway(actor);
};
