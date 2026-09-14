// -----------------------------------------------------------------------------
/**
 * @fileoverview invoices — a count read survives a row its mapper cannot map
 * (AC-2, AC-10)
 *
 * ## Job To Be Done
 * `hasUnpaid` and `consolidatableCount` read their query's `pagination.total`
 * and NEVER a row. Their reads carried `select: mapInvoices` anyway, and
 * `list()` applies `select` INSIDE its queryFn — so a mapper that throws on one
 * live row rejects the whole query. The failure is invisible from the network
 * tab: the request is a clean 200 carrying the real total, while the handle
 * reports an error, `pagination.total` falls back to 0, and `hasError` folds it
 * into the COLLECTION's error.
 *
 * That is the shape of a count reading 0 beside a response that says 72.
 *
 * ## What Breaks If These Fail
 * One unmappable invoice anywhere in a client's corpus silently zeroes the
 * consolidation notice and paints "Something went wrong" over a list that
 * loaded correctly.
 */

import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { useInvoices } from "..";
import { recorded, seedClientSession } from "./invoices.int-helpers";
import { server } from "./setup.integration";
import "./setup.integration";

// -----------------------------------------------------------------------------

/** A body whose single row is one `mapInvoice` cannot read. */
function installUnmappableCountRow(total: number) {
  const list = recorded.list();
  server?.use(
    http.get("*/invoices", ({ request }) => {
      const url = new URL(request.url);
      const isCount =
        url.searchParams.has("filter[is_consolidation]") ||
        url.searchParams.get("limit") === "1";
      return HttpResponse.json(
        isCount ? { ...list, data: [null], total } : { ...list, total: 1296 }
      );
    })
  );
}

describe("invoices — a count read survives an unmappable row", () => {
  it("AC-2 consolidatableCount reports the server's total, not 0, when a row cannot be mapped", async () => {
    await seedClientSession();
    installUnmappableCountRow(72);

    const cell = useInvoices().as("self");
    await cell.useActions().isReady();
    const meta = cell.useMeta();
    void meta.consolidatableCount.value;
    await new Promise(resolve => setTimeout(resolve, 2500));

    expect(meta.consolidatableCount.value).toBe(72);
  });

  it("AC-10 the same row does not put the COLLECTION into its error state", async () => {
    await seedClientSession();
    installUnmappableCountRow(72);

    const cell = useInvoices().as("self");
    await cell.useActions().isReady();
    const meta = cell.useMeta();
    void meta.consolidatableCount.value;
    void meta.hasUnpaid.value;
    await new Promise(resolve => setTimeout(resolve, 2500));

    expect(meta.hasError.value).toBe(false);
  });
});
