// -----------------------------------------------------------------------------
/**
 * @fileoverview invoices — the three relationship LOOKUPS on the wire.
 *
 * The labs "Act for" picker drives `useContext().lookups.<type>()`. Each thunk
 * must issue its own request and return selectable options. This pins the
 * outbound URL and the mapped items, so an empty picker is a failing test here
 * rather than a silent blank dropdown.
 */

import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { useInvoices } from "..";
import { useLookup } from "../../lookup";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installInvoiceHandlers,
  seedClientSession
} from "./invoices.int-helpers";
import { server } from "./setup.integration";
import "./setup.integration";

// -----------------------------------------------------------------------------

/** One row per lookup endpoint, shaped as the envelope the query layer unwraps. */
function installLookupHandlers(): string[] {
  const seen: string[] = [];
  const record = (request: Request) => void seen.push(request.url);

  server?.use(
    http.get("*/contracts_products", ({ request }) => {
      record(request);
      return HttpResponse.json({
        data: [
          {
            id: "cp-1",
            name: "CP One",
            product_name: "Product One",
            service_identifier: "svc-1"
          }
        ]
      });
    }),
    http.get("*/contracts", ({ request }) => {
      record(request);
      return HttpResponse.json({
        data: [
          {
            id: "co-1",
            name: "Contract One",
            main_invoice_number: "INV-1",
            total_amount_formatted: "$10.00"
          }
        ]
      });
    })
  );

  return seen;
}

describe("invoices lookups — each relationship lookup reaches the wire", () => {
  it("the contract lookup issues a request and returns options", async () => {
    await seedClientSession();
    installInvoiceHandlers();
    const seen = installLookupHandlers();

    const invoices = useInvoices().as(ScopeActorTypes.CLIENT);
    const query = invoices.useContext().lookups.contract();

    await vi.waitFor(() => expect(seen.length).toBeGreaterThan(0), {
      timeout: 4000
    });
    await vi.waitFor(() =>
      expect((query.data.value ?? []).length).toBeGreaterThan(0)
    );

    expect(decodeURIComponent(seen[0]!)).toContain("/contracts");
    expect(query.data.value?.[0]).toMatchObject({ value: "co-1" });

    useLookup(query, {
      searchScope: "filters.main_invoice_number.like"
    }).search("QAT");
    await vi.waitFor(() =>
      expect(
        seen.some(url =>
          decodeURIComponent(url).includes(
            "filter[main_invoice_number|like]=%QAT%"
          )
        )
      ).toBe(true)
    );
  });

  it("the contract-product lookup issues a request and returns options", async () => {
    await seedClientSession();
    installInvoiceHandlers();
    const seen = installLookupHandlers();

    const invoices = useInvoices().as(ScopeActorTypes.CLIENT);
    const query = invoices.useContext().lookups.contracts_product();

    await vi.waitFor(() => expect(seen.length).toBeGreaterThan(0), {
      timeout: 4000
    });
    await vi.waitFor(() =>
      expect((query.data.value ?? []).length).toBeGreaterThan(0)
    );

    expect(query.data.value?.[0]).toMatchObject({ value: "cp-1" });
  });

  it("the invoice lookup issues a request and returns options", async () => {
    await seedClientSession();
    installInvoiceHandlers();

    const invoices = useInvoices().as(ScopeActorTypes.CLIENT);
    const query = invoices.useContext().lookups.invoice();

    await vi.waitFor(
      () => expect((query.data.value ?? []).length).toBeGreaterThan(0),
      { timeout: 4000 }
    );

    expect(query.data.value?.[0]).toHaveProperty("value");
  });
});
