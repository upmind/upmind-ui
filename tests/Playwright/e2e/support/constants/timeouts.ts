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
