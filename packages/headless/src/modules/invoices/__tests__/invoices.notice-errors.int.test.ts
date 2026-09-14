// -----------------------------------------------------------------------------
/**
 * @fileoverview invoices collection — a notice read never presents as the
 * collection failing (AC-2, AC-10)
 *
 * ## Job To Be Done
 * `useMeta().hasError` folds the two dedicated notice reads —
 * `unpaid_existence` and `consolidatable_count` — into the COLLECTION's error,
 * so a surface drawing the list on `hasError` replaces the whole table with a
 * failure. That fold is deliberate (a failed count must not report a silent
 * `0`), which makes it load-bearing that neither read manufactures an error it
 * did not actually suffer.
 *
 * Both guards rejected `NotAuthenticatedError` when their `requested` flag was
 * still false — "nobody has asked for this count yet", which is not an
 * authentication failure. With `staleTime: DAY` on both, one early rejection
 * stuck for the whole session: the page drew "Something went wrong" over a list
 * that had loaded, and the notice read 0 for a count the API answers.
 *
 * ## What Breaks If These Fail
 * A page that loaded its invoices correctly reports a failure instead of
 * drawing them, and its consolidatable count reads 0 for the rest of the tab's
 * life.
 */

import { describe, expect, it } from "vitest";
import { useInvoices } from "..";
import { installInvoiceHandlers, seedClientSession } from "./invoices.int-helpers";
import "./setup.integration";

// -----------------------------------------------------------------------------

describe("invoices collection — an unasked notice read is not a collection error", () => {
  it("AC-2 a scope that never reads a count reports hasError false", async () => {
    await seedClientSession();
    installInvoiceHandlers();

    const cell = useInvoices().as("self");
    await cell.useActions().isReady();
    // Deliberately never touches `hasUnpaid` or `consolidatableCount`, so both
    // dedicated reads stay unrequested — the state that manufactured the error.
    await new Promise(resolve => setTimeout(resolve, 800));

    expect(cell.useMeta().hasError.value).toBe(false);
  });

  it("AC-10 reading the counts still reports hasError false once they answer", async () => {
    await seedClientSession();
    installInvoiceHandlers();

    const cell = useInvoices().as("self");
    await cell.useActions().isReady();

    const meta = cell.useMeta();
    void meta.hasUnpaid.value;
    void meta.consolidatableCount.value;
    await new Promise(resolve => setTimeout(resolve, 1500));

    expect(meta.hasError.value).toBe(false);
    expect(meta.consolidatableCount.value).toBeGreaterThan(0);
  });
});
