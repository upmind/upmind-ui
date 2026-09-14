// -----------------------------------------------------------------------------
/**
 * @fileoverview invoices collection — the vocabulary columns admit `eq`, not
 * only `in` (AC-2, the criteria law)
 *
 * ## Job To Be Done
 * Prove `status.code` and `category.slug` reach the wire under BOTH declared
 * operators. The query schema carries `additionalProperties: false` at every
 * level, so an operator the schema does not name is unspellable and
 * `setCriteria` strips it SILENTLY — no ajv error, no rejected promise. A
 * caller narrowing to one status therefore had to spell a one-member `in`,
 * and a plain `eq` disappeared between the model and the request.
 *
 * Asserted post-`translateQuery`, on the OUTBOUND request — the discipline
 * `review-notes.md` records for this module after three cycles of gates that
 * graded the model and passed over a broken capability.
 *
 * ## What Breaks If These Fail
 * A single-status or single-category narrowing silently returns the unfiltered
 * collection: the request goes out without the filter and the page draws every
 * invoice as though the caller had asked for them.
 */

import { describe, expect, it } from "vitest";
import { InvoiceStatus, InvoiceCategoryCode } from "@upmind-automation/types";
import { filter, includes, map } from "lodash-es";
import { useInvoices } from "..";
import {
  installInvoiceHandlers,
  observeInvoiceRequests,
  seedClientSession
} from "./invoices.int-helpers";
import "./setup.integration";

// -----------------------------------------------------------------------------

const settle = () => new Promise(resolve => setTimeout(resolve, 1200));

describe("invoices collection — vocabulary columns admit eq as well as in", () => {
  it("AC-2 a single status narrows the wire under filter[status.code|eq]", async () => {
    await seedClientSession();
    installInvoiceHandlers();
    const list = useInvoices().as("self");
    await list.useActions().isReady();

    const observed = observeInvoiceRequests();
    list.useActions().filterBy({ "status.code": { eq: InvoiceStatus.PAID } });
    await settle();
    observed.stop();

    const urls = map(observed.all(), request => decodeURIComponent(request.url));
    expect(
      filter(urls, url =>
        includes(url, `filter[status.code|eq]=${InvoiceStatus.PAID}`)
      )
    ).not.toHaveLength(0);
  });

  it("AC-2 a single category narrows the wire under filter[category.slug|eq]", async () => {
    await seedClientSession();
    installInvoiceHandlers();
    const list = useInvoices().as("self");
    await list.useActions().isReady();

    const observed = observeInvoiceRequests();
    list
      .useActions()
      .filterBy({ "category.slug": { eq: InvoiceCategoryCode.RECURRENT } });
    await settle();
    observed.stop();

    const urls = map(observed.all(), request => decodeURIComponent(request.url));
    expect(
      filter(urls, url =>
        includes(url, `filter[category.slug|eq]=${InvoiceCategoryCode.RECURRENT}`)
      )
    ).not.toHaveLength(0);
  });

  it("AC-2 `in` still reaches the wire — `eq` is an addition, not a replacement", async () => {
    await seedClientSession();
    installInvoiceHandlers();
    const list = useInvoices().as("self");
    await list.useActions().isReady();

    const observed = observeInvoiceRequests();
    list.useActions().filterBy({
      "status.code": { in: [InvoiceStatus.UNPAID, InvoiceStatus.OVERDUE] }
    });
    await settle();
    observed.stop();

    const urls = map(observed.all(), request => decodeURIComponent(request.url));
    expect(
      filter(urls, url =>
        includes(
          url,
          `filter[status.code|in]=${InvoiceStatus.UNPAID},${InvoiceStatus.OVERDUE}`
        )
      )
    ).not.toHaveLength(0);
  });
});
