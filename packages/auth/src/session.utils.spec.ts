// -----------------------------------------------------------------------------
/**
 * @fileoverview The guest-checkout offer gate
 *
 * ## Job To Be Done
 * `offersGuestCheckout` decides whether the register step offers to continue as
 * a guest. Each of its four terms must be load-bearing — flipping any one of
 * them alone withdraws the offer.
 *
 * The `isAuthenticated` term is the reason these exist. A merge on this rung
 * dropped it, and `canRegisterAsGuest` is the brand toggle ALONE — it carries no
 * authentication term of its own — so without it an already-signed-in visitor is
 * offered guest checkout. The e2e suite cannot reach that condition: the router
 * takes an authenticated visitor onward instead of rendering the register step,
 * so the offer is absent there whatever the gate says.
 *
 * ## What Breaks If These Fail
 * A signed-in customer is invited to check out as a guest, and accepting mints a
 * second, unlinked guest account over the top of their session.
 */

import { describe, expect, it } from "vitest";
import { offersGuestCheckout } from "./session.utils";

// -----------------------------------------------------------------------------

/** The one combination that offers guest checkout. */
const OFFERED = {
  isAuthenticated: false,
  canRegisterAsGuest: true,
  isBasketLoading: false,
  hasRecurringProducts: false
};

describe("offersGuestCheckout", () => {
  it("offers guest checkout to an anonymous visitor with a settled one-off basket", () => {
    expect(offersGuestCheckout(OFFERED)).toBe(true);
  });

  it("withholds the offer from a visitor who already holds a session", () => {
    expect(offersGuestCheckout({ ...OFFERED, isAuthenticated: true })).toBe(
      false
    );
  });

  it("withholds the offer when the brand disallows guest checkout", () => {
    expect(offersGuestCheckout({ ...OFFERED, canRegisterAsGuest: false })).toBe(
      false
    );
  });

  it("withholds the offer while the basket is still loading", () => {
    expect(offersGuestCheckout({ ...OFFERED, isBasketLoading: true })).toBe(
      false
    );
  });

  it("withholds the offer when the basket carries a recurring product", () => {
    expect(
      offersGuestCheckout({ ...OFFERED, hasRecurringProducts: true })
    ).toBe(false);
  });

  it("withholds the offer from an authenticated visitor even when the brand allows it", () => {
    // The pairing the dropped term was the only defence against: the brand
    // toggle is on, everything else is offerable, and the visitor is signed in.
    expect(
      offersGuestCheckout({
        ...OFFERED,
        isAuthenticated: true,
        canRegisterAsGuest: true
      })
    ).toBe(false);
  });
});
