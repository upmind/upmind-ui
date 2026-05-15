// -----------------------------------------------------------------------------
/**
 * @fileoverview mergeDomainSearchResults — Search Result Merge Tests
 *
 * ## Job To Be Done
 * Verify that `mergeDomainSearchResults` correctly merges freshly-emitted
 * search rows into the existing search result list. The dac machine's
 * `setSearchResults` action delegates to this helper to handle three
 * upstream emit orderings:
 *   1. Within one search round, `/suggestions` emits `priceLoading` rows
 *      that `/suggestions/tlds` later upgrades with real prices.
 *   2. `/availability` resolves after `/suggestions` and replaces the
 *      exact-match row with an authoritative version.
 *   3. Pagination emits the next page — existing rows must NOT change.
 *
 * ## What Breaks If These Fail
 * - A regression in (1) leaves price skeletons stuck on the row after the
 *   tlds endpoint has resolved.
 * - A regression in (2) shows the exact-match row as "available" when the
 *   API says it isn't, letting the user attempt to add an unavailable
 *   domain to the basket.
 * - A regression in (3) replaces page-1 rows when page-2 arrives, causing
 *   the visible list to flicker or lose user-applied selections.
 */

import { describe, it, expect } from "vitest";

// --- types
import type { DomainProduct } from "../types";

// -----------------------------------------------------------------------------

/**
 * Builds a minimal `DomainProduct` fixture for merge tests — only the
 * fields the merge rule reads (`domain`, `meta.priceLoading`,
 * `meta.checkedAvailability`) need to be meaningful.
 */
function product(
  domain: string,
  meta: Partial<DomainProduct["meta"]> = {}
): DomainProduct {
  const partial: Partial<DomainProduct> = {
    domain,
    sld: domain.split(".")[0],
    tld: `.${domain.split(".").slice(1).join(".")}`,
    meta: { ...meta }
  };
  return partial as DomainProduct;
}

describe("mergeDomainSearchResults", () => {
  // --- Scenario 1: priceLoading → priced upgrade
  describe("priceLoading upgrade (suggestions → suggestions/tlds)", () => {
    it("replaces a priceLoading row when the incoming row is priced", async () => {
      const { mergeDomainSearchResults } =
        await import("../mergeDomainSearchResults");

      const previous = [product("example.com", { priceLoading: true })];
      const available = [product("example.com", { priceLoading: false })];

      const result = mergeDomainSearchResults(previous, available);

      expect(result).toHaveLength(1);
      expect(result[0].meta.priceLoading).toBe(false);
    });

    it("keeps a priced row when the incoming row is still priceLoading", async () => {
      const { mergeDomainSearchResults } =
        await import("../mergeDomainSearchResults");

      const previous = [product("example.com", { priceLoading: false })];
      const available = [product("example.com", { priceLoading: true })];

      const result = mergeDomainSearchResults(previous, available);

      expect(result).toHaveLength(1);
      expect(result[0].meta.priceLoading).toBe(false);
    });
  });

  // --- Scenario 2: availability upgrade (exact match)
  describe("availability upgrade (/availability)", () => {
    it("replaces a row when the incoming row has checkedAvailability=true", async () => {
      const { mergeDomainSearchResults } =
        await import("../mergeDomainSearchResults");

      const previous = [
        product("example.com", { checkedAvailability: false, available: true })
      ];
      const available = [
        product("example.com", { checkedAvailability: true, available: false })
      ];

      const result = mergeDomainSearchResults(previous, available);

      expect(result).toHaveLength(1);
      expect(result[0].meta.checkedAvailability).toBe(true);
      expect(result[0].meta.available).toBe(false);
    });

    it("keeps an availability-checked row when incoming has not been checked", async () => {
      const { mergeDomainSearchResults } =
        await import("../mergeDomainSearchResults");

      const previous = [
        product("example.com", { checkedAvailability: true, available: false })
      ];
      const available = [
        product("example.com", { checkedAvailability: false, available: true })
      ];

      const result = mergeDomainSearchResults(previous, available);

      expect(result).toHaveLength(1);
      expect(result[0].meta.checkedAvailability).toBe(true);
      expect(result[0].meta.available).toBe(false);
    });
  });

  // --- Scenario 3: pagination — no strict upgrade
  describe("pagination (Load more)", () => {
    it("appends truly new domains at the end", async () => {
      const { mergeDomainSearchResults } =
        await import("../mergeDomainSearchResults");

      const previous = [product("page1-a.com"), product("page1-b.com")];
      const available = [product("page2-a.com"), product("page2-b.com")];

      const result = mergeDomainSearchResults(previous, available);

      expect(result.map(p => p.domain)).toEqual([
        "page1-a.com",
        "page1-b.com",
        "page2-a.com",
        "page2-b.com"
      ]);
    });

    it("keeps the page-1 version when a later page returns an overlapping domain", async () => {
      const { mergeDomainSearchResults } =
        await import("../mergeDomainSearchResults");

      // Page 1 row arrived priced and availability-checked.
      const previous = [
        product("example.com", {
          priceLoading: false,
          checkedAvailability: true
        })
      ];
      // Page 2 happens to re-emit it (neither flag is a strict upgrade).
      const available = [
        product("example.com", {
          priceLoading: false,
          checkedAvailability: true
        })
      ];

      const result = mergeDomainSearchResults(previous, available);

      expect(result).toHaveLength(1);
      // Same reference → confirms we kept the existing row, not the new one.
      expect(result[0]).toBe(previous[0]);
    });
  });

  // --- Edge cases
  describe("edge cases", () => {
    it("returns the incoming list when previous is empty (first page)", async () => {
      const { mergeDomainSearchResults } =
        await import("../mergeDomainSearchResults");

      const available = [product("example.com"), product("foo.net")];

      const result = mergeDomainSearchResults([], available);

      expect(result).toEqual(available);
    });

    it("returns previous unchanged when incoming is empty", async () => {
      const { mergeDomainSearchResults } =
        await import("../mergeDomainSearchResults");

      const previous = [product("example.com")];

      const result = mergeDomainSearchResults(previous, []);

      expect(result).toEqual(previous);
    });

    it("preserves order: kept previous rows first, then new domains", async () => {
      const { mergeDomainSearchResults } =
        await import("../mergeDomainSearchResults");

      const previous = [
        product("a.com", { priceLoading: true }),
        product("b.com", { priceLoading: true })
      ];
      const available = [
        product("c.com"), // new
        product("a.com", { priceLoading: false }), // upgrade
        product("d.com") // new
      ];

      const result = mergeDomainSearchResults(previous, available);

      expect(result.map(p => p.domain)).toEqual([
        "a.com",
        "b.com",
        "c.com",
        "d.com"
      ]);
    });

    it("treats missing meta flags as falsy (no upgrade triggered)", async () => {
      const { mergeDomainSearchResults } =
        await import("../mergeDomainSearchResults");

      // prev has no meta flags at all — incoming has no flags either.
      const previous = [product("example.com")];
      const available = [product("example.com")];

      const result = mergeDomainSearchResults(previous, available);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(previous[0]);
    });
  });
});
