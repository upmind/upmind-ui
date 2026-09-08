// -----------------------------------------------------------------------------
/**
 * @module portal/mock/dates
 * @description The one date spelling every seeded row and every write uses —
 * ISO `YYYY-MM-DD`, which is also the order the collections sort by (the
 * string order IS the date order).
 *
 * A LEAF on purpose: five facades had authored their own copy of this, two of
 * them spelled differently, and a seed's day and a write's day have to be the
 * same shape or a row written today sorts against rows seeded yesterday.
 */

/** How long an ISO calendar date is — `YYYY-MM-DD`. */
export const ISO_DATE_LENGTH = "0000-00-00".length;

/** Today, in the date spelling every seeded row uses. */
export function today(): string {
  return new Date().toISOString().slice(0, ISO_DATE_LENGTH);
}
