// --- external

// --- internal
import { useBasketPaymentDetails } from "./useBasketPaymentDetails";
import { usePaymentGateway } from "../paymentDetails";

// --- utils

// --- types

// -----------------------------------------------------------------------------
// We allow an actor to be passed in, but if not, we will use the basket service and wait for the 'actor' machine to be ready

/**
 * Determines and initialises the payment gateway to be used for basket transactions.
 *
 * This function fetches the payment details related to the basket using the `useBasketPaymentDetails` hook,
 * specifically extracting the payment gateway actor, and passes it to the `usePaymentGateway` function
 * to use the appropriate payment gateway.
 */
export const useBasketPaymentGateway = () => {
  const { gateway: actor } = useBasketPaymentDetails();

  return usePaymentGateway(actor);
};
