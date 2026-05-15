// --- internal
import { useBrand } from "../brand";

// --- types
import { BrandConfigKeys, DomainSearchMethod } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

/**
 * Resolves the brand's domain-search flow from `DOMAIN_SEARCH_METHOD`.
 *
 * Falls back to `LEGACY_LOOKUP` so the legacy `/domains/search` path
 * runs by default — the new `/suggestions` + `/suggestions/tlds` flow
 * only kicks in when the brand explicitly opts into `SMART_SUGGEST`.
 *
 * Single source of truth for both `useDomain` (parent) and `useDac`
 * (child), so the flag derivation can't drift between entry points.
 */
export function useDomainSearchMethod() {
  const { getConfigValue } = useBrand();

  const searchMethod =
    getConfigValue<DomainSearchMethod>(BrandConfigKeys.DOMAIN_SEARCH_METHOD) ??
    DomainSearchMethod.LEGACY_LOOKUP;
  const useSuggestions = searchMethod === DomainSearchMethod.SMART_SUGGEST;

  return { searchMethod, useSuggestions };
}
