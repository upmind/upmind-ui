/**
 * @fileoverview invoices — the page writes of a collection (`setPage`, `setLimit`)
 *
 * ## Job To Be Done
 * Prove the page window each page write commits (design 8.3 "Page writes"):
 * a page write holds the live limit, a limit write goes back to page one, and
 * a page or a limit below one is clamped to one — the platform reads a limit
 * of zero as every row.
 *
 * ## What Breaks If These Fail
 * Asking for page three shows page one, a page-size change keeps a stale
 * offset, or a zero page size makes the platform send the whole history.
 */

import { afterEach, describe, expect, it } from "vitest";
import { nextTick } from "vue";
import { openCell, resetCells } from "./invoices.unit-helpers";

afterEach(resetCells);

// FE-3237 AC3
describe("AC-21: page writes keep the window whole", () => {
  it("a page write sends the offset of that page at the live limit", async () => {
    const { actions, view } = openCell();
    await actions.setPage(3);
    await nextTick();
    expect(view().query.pagination).toEqual({ limit: 10, offset: 20 });
    expect(view().pagination.page).toBe(3);
  });

  it("a limit write goes back to page one at the new limit", async () => {
    const { actions, view } = openCell();
    await actions.setPage(4);
    await actions.setLimit(25);
    await nextTick();
    expect(view().query.pagination).toEqual({ limit: 25, offset: 0 });
  });

  it("a page write after a limit write uses the new limit", async () => {
    const { actions, view } = openCell();
    await actions.setLimit(25);
    await actions.setPage(2);
    await nextTick();
    expect(view().query.pagination).toEqual({ limit: 25, offset: 25 });
  });

  it("clamps a page of zero or below to page one", async () => {
    const { actions, view } = openCell();
    await actions.setPage(3);
    await actions.setPage(0);
    await nextTick();
    expect(view().query.pagination).toEqual({ limit: 10, offset: 0 });
    await actions.setPage(3);
    await actions.setPage(-4);
    await nextTick();
    expect(view().query.pagination).toEqual({ limit: 10, offset: 0 });
  });

  it("clamps a limit of zero or below to one, never to every row", async () => {
    const { actions, view } = openCell();
    await actions.setLimit(0);
    await nextTick();
    expect(view().query.pagination).toEqual({ limit: 1, offset: 0 });
    await actions.setLimit(-3);
    await nextTick();
    expect(view().query.pagination).toEqual({ limit: 1, offset: 0 });
  });

  it("tells a page past one that a previous page exists, and page one that none does", async () => {
    const { actions, view } = openCell();
    await actions.setPage(2);
    await nextTick();
    expect(view().meta.hasPrevPage).toBe(true);
    await actions.setPage(1);
    await nextTick();
    expect(view().meta.hasPrevPage).toBe(false);
  });

  it("tells an empty history it has no next page and no second page", async () => {
    const { view } = openCell();
    await nextTick();
    expect(view().meta).toEqual({
      hasNextPage: false,
      hasPrevPage: false,
      hasPages: false
    });
  });

  it("writes the same page window on the default invoice list", async () => {
    const { actions, view } = openCell("invoices");
    await actions.setPage(3);
    await nextTick();
    expect(view().query.pagination).toEqual({ limit: 10, offset: 20 });
  });
});
