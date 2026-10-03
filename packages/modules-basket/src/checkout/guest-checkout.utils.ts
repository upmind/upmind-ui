// -----------------------------------------------------------------------------
/**
 * @module basket/checkout/guest-checkout
 * @description The guest-checkout offer's own gate.
 */

/**
 * Whether the guest-checkout offer is shown. `canRegisterAsGuest` is the brand
 * toggle alone and carries no authentication term, so without `isAuthenticated`
 * the offer reaches a visitor who already holds a session.
 */
export function offersGuestCheckout(terms: {
  isAuthenticated: boolean;
  canRegisterAsGuest: boolean;
  isBasketLoading: boolean;
  hasRecurringProducts: boolean;
}): boolean {
  const isAnonymous = !terms.isAuthenticated;
  const brandAllows = terms.canRegisterAsGuest;
  const basketSettled = !terms.isBasketLoading;
  const isOneOffBasket = !terms.hasRecurringProducts;

  return isAnonymous && brandAllows && basketSettled && isOneOffBasket;
}
