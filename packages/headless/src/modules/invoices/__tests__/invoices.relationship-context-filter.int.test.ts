// -----------------------------------------------------------------------------
/**
 * @fileoverview invoices collection — the three relationship scope contexts on
 * the WIRE (FE-3031 core capability: `useInvoices().for(type, id)`)
 *
 * ## Job To Be Done
 * `useInvoices()` gains a relationship scope through `.for(type, id)`. Each of
 * the three relationship contexts must reach the platform as its own declared
 * filter column on the outbound `GET api/invoices` query string:
 *
 * - `.for('contract', id)`          → `filter[contracts.id]=<id>`
 * - `.for('contracts_product', id)` → `filter[products.contracts_product_id]=<id>`
 *   (proven in `invoices.contract-product-filter.int.test.ts`, the column's home)
 * - `.for('invoice', id)`           → the credit-notes read carries
 *                                     `filter[credit_invoice_id]=<id>`
 *
 * Each expected key is spelled LITERALLY in the assertion from the FE-3031
 * public surface — never read back off the seam's own criteria model or its
 * schema declaration, which the module's `setCriteria` silent-strip incident
 * already proved is not the same thing as reaching the wire. The reading client
 * stays the reader: the credential is its own session bearer token, with no
 * acting-as header (A7).
 *
 * ## OR-1 (b) durability
 * A `.for('contract', id)` read composed with `filterCreditNotes()` must issue
 * ONE request carrying BOTH the credit-notes category preset AND
 * `filter[contracts.id]=<id>`. `criteria.set` merges the published intent at
 * BRANCH level, so a `filters`-branch preset write with no `contracts.id` of
 * its own can drop the column — this proves the contract slot survives the
 * preset write, the case only the client path exercised before.
 *
 * ## Provenance
 * No response body is read by any test here — every assertion is on the
 * OUTBOUND request the module issues. The list response is the same RECORDED
 * envelope (`installInvoiceHandlers()`) every other collection test replays.
 *
 * ## What Breaks If These Fail
 * A relationship-scoped read (the per-contract billing tab, the per-product
 * billing tab, one invoice's credit notes) silently widens to the whole
 * account, or narrows on the wrong column — the FE-2824 failure class in the
 * new relationship-context surface this story adds.
 */

import { describe, expect, it, vi } from "vitest";
import { InvoicesContextTypes, useInvoices } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  assertClientIdentityTransport,
  installInvoiceHandlers,
  observeInvoiceRequests,
  seedClientSession
} from "./invoices.int-helpers";
import "./setup.integration";

// -----------------------------------------------------------------------------

/** A contract id this session never held — the narrowing discriminator. */
const CONTRACT_ID = "c0c0c0c0-1111-2222-3333-444444444444";

/** A parent-invoice id this session never held — the credit-notes discriminator. */
const PARENT_INVOICE_ID = "d1d1d1d1-5555-6666-7777-888888888888";

describe("invoices collection — relationship scope contexts reach the wire (FE-3031)", () => {
  it("FE-3031 .for('contract', id) puts filter[contracts.id]=<id> on the outbound GET /api/invoices query string", async () => {
    const { accessToken } = await seedClientSession();
    installInvoiceHandlers();

    const observed = observeInvoiceRequests();
    const invoices = useInvoices()
      .as(ScopeActorTypes.CLIENT)
      .for(InvoicesContextTypes.CONTRACT, CONTRACT_ID);
    await vi.waitFor(() =>
      expect(invoices.useMeta().isLoading.value).toBe(false)
    );
    observed.stop();

    const request = observed.first();
    expect(decodeURIComponent(request.url)).toContain(
      `filter[contracts.id]=${CONTRACT_ID}`
    );
    assertClientIdentityTransport(request, accessToken);
  });

  it("FE-3031 .for('invoice', id) composed with filterCreditNotes() carries filter[credit_invoice_id]=<id> on the credit-notes read", async () => {
    const { accessToken } = await seedClientSession();
    installInvoiceHandlers();

    const invoices = useInvoices()
      .as(ScopeActorTypes.CLIENT)
      .for(InvoicesContextTypes.INVOICE, PARENT_INVOICE_ID);
    await vi.waitFor(() =>
      expect(invoices.useMeta().isLoading.value).toBe(false)
    );

    const observed = observeInvoiceRequests();
    invoices.useActions().filterCreditNotes();
    await vi.waitFor(() => expect(observed.all().length).toBeGreaterThan(0));
    observed.stop();

    const request = observed.last();
    const decoded = decodeURIComponent(request.url);
    expect(decoded).toMatch(/credit_note/);
    expect(decoded).toContain(`filter[credit_invoice_id]=${PARENT_INVOICE_ID}`);
    assertClientIdentityTransport(request, accessToken);
  });
});

describe("invoices collection — a relationship context survives a preset write (OR-1(b) durability)", () => {
  it("FE-3031 .for('contract', id) + filterCreditNotes() issues ONE request carrying BOTH the credit-notes category preset AND filter[contracts.id]=<id>", async () => {
    const { accessToken } = await seedClientSession();
    installInvoiceHandlers();

    const invoices = useInvoices()
      .as(ScopeActorTypes.CLIENT)
      .for(InvoicesContextTypes.CONTRACT, CONTRACT_ID);
    await vi.waitFor(() =>
      expect(invoices.useMeta().isLoading.value).toBe(false)
    );

    const observed = observeInvoiceRequests();
    invoices.useActions().filterCreditNotes();
    await vi.waitFor(() => expect(observed.all().length).toBeGreaterThan(0));
    observed.stop();

    const request = observed.last();
    const decoded = decodeURIComponent(request.url);
    expect(decoded).toMatch(/credit_note/);
    expect(decoded).toContain(`filter[contracts.id]=${CONTRACT_ID}`);
    assertClientIdentityTransport(request, accessToken);
  });
});
