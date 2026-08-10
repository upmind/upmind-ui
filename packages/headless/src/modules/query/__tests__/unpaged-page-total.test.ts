// -----------------------------------------------------------------------------
/**
 * @fileoverview `resolvePageTotal` / `toPaginationInfo` — the published page state
 *
 * ## Job To Be Done
 * Six of the seven migrated modules declare `pagination.limit` default `0` —
 * unpaged. This proves what an unpaged list reports: exactly ONE page however
 * many rows it holds, a `to` that covers the whole set, and no divide-by-zero
 * page count. The paged arm is proven alongside it so the boundary is a
 * boundary rather than a special case standing on its own.
 *
 * ## What Breaks If This Fails
 * An unpaged collection reporting `pages: 0` (or `Infinity`) shows the consumer
 * a Next control that moves nothing, and `hasNextPage` goes true on a list that
 * has no next page — the six unpaged modules gain a dead pager each.
 */

import { describe, expect, it } from "vitest";
import { resolvePageTotal, toPaginationInfo } from "..";

// -----------------------------------------------------------------------------

describe("resolvePageTotal — an unpaged list is one page", () => {
  it("reports one page for an unpaged collection of many rows", () => {
    expect(resolvePageTotal(98, 0)).toBe(1);
  });

  it("reports one page for an unpaged EMPTY collection", () => {
    expect(resolvePageTotal(0, 0)).toBe(1);
  });

  it("never reports zero pages for a paged empty collection", () => {
    expect(resolvePageTotal(0, 10)).toBe(1);
  });
});

describe("resolvePageTotal — a paged list rounds up", () => {
  it("rounds a partial last page up", () => {
    expect(resolvePageTotal(98, 10)).toBe(10);
  });

  it("reports an exact multiple without an empty trailing page", () => {
    expect(resolvePageTotal(20, 10)).toBe(2);
  });
});

describe("toPaginationInfo — what the handle publishes", () => {
  it("spans the whole set on an unpaged read", () => {
    expect(toPaginationInfo(98, 0, 1)).toEqual({
      limit: 0,
      total: 98,
      page: 1,
      pages: 1,
      from: 1,
      to: 98
    });
  });

  it("reports an empty collection as spanning nothing", () => {
    expect(toPaginationInfo(0, 0, 1)).toEqual({
      limit: 0,
      total: 0,
      page: 1,
      pages: 1,
      from: 0,
      to: 0
    });
  });

  it("reports the window of a middle page", () => {
    expect(toPaginationInfo(98, 10, 3)).toEqual({
      limit: 10,
      total: 98,
      page: 3,
      pages: 10,
      from: 21,
      to: 30
    });
  });

  it("clamps the last page's `to` to the total", () => {
    expect(toPaginationInfo(98, 10, 10)).toMatchObject({ from: 91, to: 98 });
  });
});
