// -----------------------------------------------------------------------------
/**
 * @module modules/checkout/guest-checkout
 * @description The guest-checkout offer's own gate. The brand toggle behind it
 * is `invoices.guest_checkout.enabled` — the platform files it under invoices —
 * so the OFFER is commerce policy and belongs to checkout. `auth` keeps the
 * verb: it mints the guest session and hands `registerAsGuest` to this offer
 * through `foundation`'s shell socket (ADR 023 §7).
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
