// -----------------------------------------------------------------------------
/**
 * @fileoverview invoices collection — filters reach the wire as BARE keys
 * (AC-2, the criteria law)
 *
 * ## Job To Be Done
 * Pin the wire SPELLING of this module's filter columns: `filter[status.code]`,
 * not `filter[status.code|in]`. The platform rejects the suffixed form with a
 * 422, and the legacy app (`invoicesProvider.vue`, `getConsolidatableTotal`)
 * has always sent the bare form — one value or a comma-separated list, both
 * under the same key.
 *
 * `translateQuery` decides this off the SCHEMA, not the model: a filter branch
 * declaring operator sub-properties emits `filter[column|operator]`, and one
 * declaring none emits `filter[column]`. So these cases guard a schema shape,
 * and they fail the moment a column re-grows an operator bag.
 *
 * Asserted post-`translateQuery`, on the OUTBOUND request — the discipline
 * `review-notes.md` records for this module after three cycles of gates that
 * graded the model and passed over a broken capability.
 *
 * ## What Breaks If These Fail
 * Every list read 422s. The page draws no invoices at all, and the dedicated
 * count reads behind the unpaid and consolidatable notices silently report 0.
 */

import { describe, expect, it } from "vitest";
import { InvoiceCategoryCode, InvoiceStatus } from "@upmind-automation/types";
import { filter, includes, map, some } from "lodash-es";
import { useInvoices } from "..";
import {
  installInvoiceHandlers,
  observeInvoiceRequests,
  seedClientSession
} from "./invoices.int-helpers";
import "./setup.integration";

// -----------------------------------------------------------------------------

const settle = () => new Promise(resolve => setTimeout(resolve, 1200));

/** Every outbound invoices URL, decoded, since the observer was opened. */
async function wireAfter(write: () => void): Promise<string[]> {
  await seedClientSession();
  installInvoiceHandlers();
  const list = useInvoices().as("self");
  await list.useActions().isReady();

  const observed = observeInvoiceRequests();
  write.call(list);
  await settle();
  observed.stop();

  return map(observed.all(), request => decodeURIComponent(request.url));
}

describe("invoices collection — filters reach the wire as bare keys", () => {
  it("AC-2 one status spells filter[status.code], never filter[status.code|eq]", async () => {
    const urls = await wireAfter(function (this: ReturnType<typeof useInvoices>) {
      this.useActions().filterBy({ "status.code": InvoiceStatus.PAID });
    });

    expect(
      filter(urls, url =>
        includes(url, `filter[status.code]=${InvoiceStatus.PAID}`)
      )
    ).not.toHaveLength(0);
    expect(some(urls, url => includes(url, "filter[status.code|"))).toBe(false);
  });

  it("AC-2 several statuses ride ONE bare key as a comma list, never filter[status.code|in]", async () => {
    const urls = await wireAfter(function (this: ReturnType<typeof useInvoices>) {
      this.useActions().filterBy({
        "status.code": [InvoiceStatus.UNPAID, InvoiceStatus.OVERDUE]
      });
    });

    expect(
      filter(urls, url =>
        includes(
          url,
          `filter[status.code]=${InvoiceStatus.UNPAID},${InvoiceStatus.OVERDUE}`
        )
      )
    ).not.toHaveLength(0);
    expect(some(urls, url => includes(url, "filter[status.code|"))).toBe(false);
  });

  it("AC-2 the category column spells the same way", async () => {
    const urls = await wireAfter(function (this: ReturnType<typeof useInvoices>) {
      this.useActions().filterBy({
        "category.slug": InvoiceCategoryCode.RECURRENT
      });
    });

    expect(
      filter(urls, url =>
        includes(url, `filter[category.slug]=${InvoiceCategoryCode.RECURRENT}`)
      )
    ).not.toHaveLength(0);
    expect(some(urls, url => includes(url, "filter[category.slug|"))).toBe(
      false
    );
  });

  it("AC-2 NO invoices request carries a suffixed filter key at all", async () => {
    // The whole-request sweep the per-column cases cannot make: a column this
    // file does not name re-growing an operator bag is the same 422.
    const urls = await wireAfter(function (this: ReturnType<typeof useInvoices>) {
      this.useActions().filterConsolidatable();
    });

    expect(filter(urls, url => /filter\[[^\]]+\|/.test(url))).toEqual([]);
  });
});
