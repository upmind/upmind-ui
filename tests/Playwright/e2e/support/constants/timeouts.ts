// Per-test timeout budgets (ms) for flows that legitimately exceed Playwright's
// global 60s default.

/**
 * Budget for offsite / SCA payment journeys — the longest flows in the suite:
 * register + basket + checkout + Stripe element + a hosted-page round-trip
 * (Stripe 3DS challenge to hooks.stripe.com, or an iDEAL authorize redirect) +
 * return + confirmation. These measurably complete (~110s solo for 3DS) but
 * straddle the global 60s under full-suite parallel load. A realistic budget,
 * not a workaround — each such flow is verified end-to-end.
 */
export const OFFSITE_PAYMENT_TIMEOUT = 120000;

/**
 * Budget for the terminal signal after clicking Place Order: the gateway
 * round-trip, the order conversion (PATCH /orders/{id}/convert), the
 * placement POST /api/payments and the funnel's navigation off the checkout
 * route. Measured at ~12s for a Stripe card on staging; 45s is the same
 * budget the previous hand-rolled wait used, kept unchanged.
 */
export const PLACE_ORDER_TIMEOUT = 45000;

/**
 * Budget for an in-page card journey: register + basket + a full document
 * reload into checkout + Stripe Elements mount + a real staging charge. This is
 * the critical path, so it must never report a false red.
 *
 * Measured on staging: 83 API calls, 58.2s of cumulative API time, 42-53s wall
 * per test. Against the global 60s that leaves under 7s of headroom, so six-way
 * parallel load tipped the slowest over and Playwright graded the timeout as a
 * failure. Serial mode is NOT the fix — it aborts the whole describe on the
 * first slow test (one timeout skipped 17 others).
 *
 * 120s is the same budget the offsite journeys already carry. It buys headroom
 * for contention; it does not mask a hang, because a genuinely stuck journey
 * fails on an assertion or a locator long before this.
 */
export const CARD_PAYMENT_TIMEOUT = 120000;
