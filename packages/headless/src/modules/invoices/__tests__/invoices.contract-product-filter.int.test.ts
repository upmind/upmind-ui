// -----------------------------------------------------------------------------
/**
 * @fileoverview invoices — `.for('contracts_product', id)` puts
 * `filter[products.contracts_product_id]=<id>` on the outbound list request.
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

describe("invoices collection — narrows by contract product on the wire (AC-18)", () => {
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
});
