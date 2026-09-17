// -----------------------------------------------------------------------------
/**
 * @fileoverview invoices collection — narrow to one contract product's
 * invoices, on the WIRE (AC-18, FE-3031's mid-run addition)
 *
 * ## Job To Be Done
 * `67c7bf7c2` landed a `client-vue` UNIT test
 * (`invoices-contract-product-id-wire.test.ts`) proving the declared
 * `products.contracts_product_id` column survives `translateQuery` — the
 * MODEL, one step before the request is built. This file proves the same
 * capability on the WIRE: that a criteria write on the declared column puts
 * `filter[products.contracts_product_id]=<id>` on the OUTBOUND
 * `GET /api/invoices` query string, decoded from the observed request URL —
 * never read off the criteria model and never off the schema declaration,
 * which the module's own `setCriteria` silent-strip incident
 * (`review-notes.md`) already proved is not the same thing as reaching the
 * wire; that the BARE spelling `contract_product_id` the AC's own sentence
 * names is refused by the declared criteria, the same standard AC-15 holds
 * every other undeclared column to; and that on a `.for('client', X)` scope
 * the narrowing does not re-widen the retarget — the same A7 standard every
 * other write in `invoices.scope-identity.int.test.ts` is held to.
 *
 * ## Provenance
 * No response body is read by any test in this file — every assertion is on
 * the OUTBOUND request the module issues, never on a wire body. The list
 * response served by `installInvoiceHandlers()` is the same RECORDED
 * envelope every other collection test in this module replays.
 *
 * ## What Breaks If These Fail
 * The per-product Billing tab narrows to the wrong column (or none at all),
 * a hand-appended bare `contract_product_id` silently reaches the platform
 * where the declared column should have refused it, or narrowing to a
 * product silently re-widens a `.for('client', X)` read back to the reader's
 * own invoices — the FE-2824 failure class in a new place.
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

/** A contract-product id this scope never held — the narrowing discriminator. */
const PRODUCT_ID = "aaaa1111-bbbb-2222-cccc-3333dddd4444";

/** A client id this session never had — the retarget discriminator. */
const OTHER_CLIENT_ID = "11111111-2222-3333-4444-555555555555";

describe("invoices collection — narrows by contract product on the wire (AC-18)", () => {
  it("AC-18 setCriteria({ filters: { 'products.contracts_product_id' } }) puts filter[products.contracts_product_id]=<id> on the outbound GET /api/invoices query string", async () => {
    const { accessToken } = await seedClientSession();
    installInvoiceHandlers();

    const invoices = useInvoices().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(invoices.useMeta().isLoading.value).toBe(false)
    );

    const observed = observeInvoiceRequests();
    invoices.useActions().setCriteria({
      filters: { "products.contracts_product_id": PRODUCT_ID }
    });
    await vi.waitFor(() => expect(observed.all().length).toBeGreaterThan(0));
    observed.stop();

    const request = observed.last();
    const decoded = decodeURIComponent(request.url);
    expect(decoded).toContain(
      `filter[products.contracts_product_id]=${PRODUCT_ID}`
    );
    assertClientIdentityTransport(request, accessToken);
  });

  it("AC-18 the bare spelling contract_product_id (the AC sentence's own noun) is refused by the declared criteria — never silently passed through, never silently applied", async () => {
    await seedClientSession();
    installInvoiceHandlers();

    const invoices = useInvoices().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(invoices.useMeta().isLoading.value).toBe(false)
    );

    const observed = observeInvoiceRequests();
    invoices.useActions().setCriteria({
      filters: {
        contract_product_id: "refused-bare-spelling-001"
      } as never
    });
    await new Promise(resolve => setTimeout(resolve, 1200));
    observed.stop();

    // Refused, not applied: the bare spelling never survives into the
    // published criteria, and consequently never reaches the wire on any
    // request this scope issues — the same discipline AC-15 already holds
    // every other undeclared column to.
    expect(invoices.useContext().query.value.filters ?? {}).not.toHaveProperty(
      "contract_product_id"
    );
    for (const request of observed.all()) {
      expect(request.url).not.toContain("contract_product_id");
      expect(request.url).not.toContain("refused-bare-spelling-001");
    }
  });

  it("FE-3031 .for('contracts_product', id) puts filter[products.contracts_product_id]=<id> on the outbound GET /api/invoices query string — the scope-context slot form", async () => {
    const { accessToken } = await seedClientSession();
    installInvoiceHandlers();

    const observed = observeInvoiceRequests();
    const invoices = useInvoices()
      .as(ScopeActorTypes.CLIENT)
      .for(InvoicesContextTypes.CONTRACT_PRODUCT, PRODUCT_ID);
    await vi.waitFor(() =>
      expect(invoices.useMeta().isLoading.value).toBe(false)
    );
    observed.stop();

    const request = observed.first();
    expect(decodeURIComponent(request.url)).toContain(
      `filter[products.contracts_product_id]=${PRODUCT_ID}`
    );
    assertClientIdentityTransport(request, accessToken);
  });

  it("AC-18 narrowing a .for('client', X) scope to one contract product still carries the TARGET client's id — narrowing never re-widens the retarget", async () => {
    const { accessToken } = await seedClientSession();
    installInvoiceHandlers();

    const invoices = useInvoices()
      .as(ScopeActorTypes.CLIENT)
      .for(InvoicesContextTypes.CLIENT, OTHER_CLIENT_ID);
    await vi.waitFor(() =>
      expect(invoices.useMeta().isLoading.value).toBe(false)
    );

    const observed = observeInvoiceRequests();
    invoices.useActions().setCriteria({
      filters: { "products.contracts_product_id": PRODUCT_ID }
    });
    await vi.waitFor(() => expect(observed.all().length).toBeGreaterThan(0));
    observed.stop();

    const request = observed.last();
    const decoded = decodeURIComponent(request.url);
    expect(decoded).toContain(
      `filter[products.contracts_product_id]=${PRODUCT_ID}`
    );
    expect(decoded).toContain(`filter[client_id]=${OTHER_CLIENT_ID}`);
    assertClientIdentityTransport(request, accessToken);
  });
});
