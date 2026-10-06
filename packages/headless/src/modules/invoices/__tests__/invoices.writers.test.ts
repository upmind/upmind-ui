/**
 * @fileoverview invoices — the filter writers (`search`, `filterBy`)
 *
 * ## Job To Be Done
 * Prove what each filter writer commits (design 8.3 "Writer rules"): two
 * searches inside 250 ms make one write with the last term; `filterBy` merges
 * its columns into the live filters, a nil column goes away, and every writer
 * writes a fresh copy, never the live filters object.
 *
 * ## What Breaks If These Fail
 * Each keystroke of a search reads the list again, a second filter drops the
 * first, a cleared filter stays on, or a write mutates the filters a read
 * already keyed on.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { nextTick, watch } from "vue";
import { InvoiceStatus } from "@upmind-automation/types";
import { openCell, resetCells } from "./invoices.unit-helpers";

afterEach(() => {
  vi.useRealTimers();
  resetCells();
});

const UNPAID_CHOICE = "invoice_unpaid,invoice_adjusted";

// FE-3237 AC11
describe("AC-28: the filter writers", () => {
  it("makes two searches inside 250 ms into one write, with the last term", async () => {
    vi.useFakeTimers();
    const { actions, view, published } = openCell();
    const writes: unknown[] = [];
    watch(
      () => published.query,
      query => writes.push(query),
      { deep: true, flush: "sync" }
    );

    actions.search("QA-INV-1");
    await vi.advanceTimersByTimeAsync(100);
    actions.search("QA-INV-2");
    await vi.advanceTimersByTimeAsync(249);
    await nextTick();
    expect(view().query.filters?.number).toBeUndefined();

    await vi.advanceTimersByTimeAsync(1);
    await nextTick();
    expect(view().query.filters?.number).toEqual({ eq: "QA-INV-2" });
    expect(writes).toHaveLength(1);
  });

  it("removes the number leaf when the search term is empty", async () => {
    vi.useFakeTimers();
    const { actions, view } = openCell();
    actions.search("QA-INV-1");
    await vi.advanceTimersByTimeAsync(300);
    actions.search("");
    await vi.advanceTimersByTimeAsync(300);
    await nextTick();
    expect(view().query.filters?.number).toBeUndefined();
  });

  it("writes the bare number leaf on the default invoice list", async () => {
    vi.useFakeTimers();
    const { actions, view } = openCell("invoices");
    actions.search("QA-INV-1");
    await vi.advanceTimersByTimeAsync(300);
    await nextTick();
    expect(view().query.filters?.number).toBe("QA-INV-1");
  });

  it("merges each filterBy column into the live filters", async () => {
    const { actions, view } = openCell();
    await actions.filterBy({ "status.code": { eq: [UNPAID_CHOICE] } });
    await actions.filterBy({
      "products.product.category.name": { like: "Hosting" }
    });
    await nextTick();
    expect(view().query.filters).toEqual({
      "status.code": { eq: [UNPAID_CHOICE] },
      "products.product.category.name": { like: "Hosting" }
    });
  });

  it("replaces a column filterBy names again, and keeps the others", async () => {
    const { actions, view } = openCell();
    await actions.filterBy({
      "status.code": { eq: [UNPAID_CHOICE] },
      total_amount: { gte: 10 }
    });
    await actions.filterBy({ "status.code": { neq: [InvoiceStatus.PAID] } });
    await nextTick();
    expect(view().query.filters).toEqual({
      "status.code": { neq: [InvoiceStatus.PAID] },
      total_amount: { gte: 10 }
    });
  });

  it("drops a column whose filterBy value is undefined", async () => {
    const { actions, view } = openCell();
    await actions.filterBy({
      "status.code": { eq: [UNPAID_CHOICE] },
      total_amount: { gte: 10 },
      "products.product.name": { like: "Hat" }
    });
    await actions.filterBy({
      total_amount: undefined,
      "products.product.name": undefined
    });
    await nextTick();
    expect(view().query.filters).toEqual({
      "status.code": { eq: [UNPAID_CHOICE] }
    });
  });

  it("writes a fresh copy, never the live filters object", async () => {
    const { actions, view } = openCell();
    await actions.filterBy({ "status.code": { eq: [UNPAID_CHOICE] } });
    await nextTick();
    const before = view().query.filters;
    const snapshot = structuredClone(before);
    await actions.filterBy({ total_amount: { gte: 10 } });
    await actions.filters.itemName("Hat");
    await nextTick();
    expect(before).toEqual(snapshot);
    expect(view().query.filters).not.toBe(before);
  });

  it("searches on a fresh copy, never the live number leaf", async () => {
    vi.useFakeTimers();
    const { actions, view } = openCell();
    await actions.filterBy({ number: { eq: "QA-INV-1" } });
    await nextTick();
    const before = view().query.filters;
    const snapshot = structuredClone(before);

    actions.search("QA-INV-2");
    await vi.advanceTimersByTimeAsync(300);
    await nextTick();
    expect(before).toEqual(snapshot);
    expect(view().query.filters?.number).toEqual({ eq: "QA-INV-2" });

    const replaced = view().query.filters;
    const replacedSnapshot = structuredClone(replaced);
    actions.search("");
    await vi.advanceTimersByTimeAsync(300);
    await nextTick();
    expect(replaced).toEqual(replacedSnapshot);
    expect(view().query.filters?.number).toBeUndefined();
  });
});
