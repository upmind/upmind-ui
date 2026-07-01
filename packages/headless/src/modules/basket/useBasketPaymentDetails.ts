import { usePaymentDetail } from "../payment-details";
import { useBasket } from ".";

// --- utils

// --- types

// -----------------------------------------------------------------------------
// We allow an actor to be passed in, but if not, we will use the basket service and wait for the 'actor'' machine to be ready

/**
 * Retrieves the payment details related to the basket by using the actor model.
 *
 * This function leverages the basket's paymentDetails actor to collect
 * and manage payment-related data. It combines the context of the basket
 * with the payment details actor to simplify access to payment details.
 */
export const useBasketPaymentDetails = () => {
  const { actors } = useBasket();
  const actor = actors.paymentDetail;

  return usePaymentDetail(actor);
};
