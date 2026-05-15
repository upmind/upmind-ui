// --- utils
import { compact, filter, find, map } from "lodash-es";

// --- types
import type { DomainProduct } from "./types";

// -----------------------------------------------------------------------------

/**
 * Merges a freshly-emitted batch of search results into the previously-rendered
 * list, by `domain`. Three upstream emit scenarios drive the rules:
 *
 *  1. Within one search round, `/suggestions` emits `priceLoading` rows and
 *     `/suggestions/tlds` re-emits the same rows priced — the row must
 *     upgrade in-place so the UI re-renders skeletons → real prices.
 *  2. `/availability` resolves after `/suggestions` and produces an
 *     authoritative version of the exact-match row (with
 *     `checkedAvailability=true`). It must replace the suggestion-derived
 *     version even when both are "priced".
 *  3. Pagination (Load more) emits the next page; existing rows must NOT
 *     change. If the API happens to return overlapping domains in a later
 *     page, keep the already-loaded version.
 *
 * Rule: replace an existing row when the incoming row is **strictly fresher**:
 *   - `priceLoading` → not `priceLoading` (price upgrade), OR
 *   - `!checkedAvailability` → `checkedAvailability` (availability upgrade).
 *
 * Otherwise leave the existing row alone. Truly new domains are appended.
 *
 * Pure — both inputs must be pre-flagged (owned/added/disabled etc.) by
 * the caller; this function only resolves the merge ordering.
 *
 * Lives in its own file (not `./utils.ts`) so the unit spec can import the
 * pure helper without triggering the runtime cascade through `../brand`
 * and `../product` that `./utils.ts` pulls in.
 */
export function mergeDomainSearchResults(
  previous: DomainProduct[],
  available: DomainProduct[]
): DomainProduct[] {
  const updatedPrevious = map(previous, (prev: DomainProduct) => {
    const fresher = find(available, ["domain", prev.domain]);
    if (!fresher) return prev;
    const isPriceUpgrade =
      !!prev.meta?.priceLoading && !fresher.meta?.priceLoading;
    const isAvailabilityUpgrade =
      !prev.meta?.checkedAvailability && !!fresher.meta?.checkedAvailability;
    return (
      isPriceUpgrade || isAvailabilityUpgrade ? fresher : prev
    ) as DomainProduct;
  });

  const newOnly = filter(
    available,
    (item: DomainProduct) => !find(previous, ["domain", item.domain])
  ) as DomainProduct[];

  return compact([...updatedPrevious, ...newOnly]);
}
