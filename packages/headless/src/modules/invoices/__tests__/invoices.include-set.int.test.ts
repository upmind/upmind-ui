// -----------------------------------------------------------------------------
/**
 * @fileoverview invoices single read — the include set may not shrink below
 * its floor
 *
 * ## Job To Be Done
 * Prove `useInvoice().withId(id)` issues its outbound `GET /invoices/{id}`
 * carrying every relation the pre-conversion module already requested (the
 * FLOOR, 17 relations) plus this story's additions —
 * `docs/sdd/FE-3031/design.md` "The include sets — named exactly, and they
 * may not shrink." A relation silently dropped from the wire is a capability
 * regression invisible to any test that only inspects the MAPPED response,
 * because MSW replay serves a fixed recorded body regardless of the
 * request's own `with=` content — this asserts the OUTBOUND request itself.
 *
 * ## Provenance
 * No response body assertion here — only the outbound request's query
 * string is asserted, per this repo's A7 read-back discipline
 * (`verify-reality-check.companion.md`).
 */

import { describe, expect, it, vi } from "vitest";
import { useInvoice } from "..";
import {
  installInvoiceHandlers,
  observeInvoiceRequests,
  recorded,
  seedClientSession
} from "./invoices.int-helpers";
import "./setup.integration";

// -----------------------------------------------------------------------------

const FLOOR_RELATIONS = [
  "brand",
  "taxes",
  "client",
  "status",
  "contract",
  "payments",
  "payments.payment_details",
  "products",
  "promotions",
  "client.tags",
  "products.tags",
  "taxes.tax_tag_data",
  "custom_fields.field",
  "affiliate_commissions",
  "products.product.image",
  "account.affiliate_referral.affiliate_account.account.client",
  "address",
  "address.country",
  "category",
  "payments.gateway",
  "payments.payment_type",
  "payment_details",
  "gateway",
  "client.parent_client_config",
  "last_payment_log"
];

// -----------------------------------------------------------------------------

describe("invoices single read — the include set may not shrink below its floor", () => {
  it("carries every floor relation on the outbound GET /invoices/{id}", async () => {
    await seedClientSession();
    installInvoiceHandlers();
    const target = recorded.unpaid();

    const observed = observeInvoiceRequests();
    const single = useInvoice().withId(target.id);
    await vi.waitFor(() =>
      expect(single.useMeta().isLoading.value).toBe(false)
    );
    observed.stop();

    const request = observed.matching(`/invoices/${target.id}`)[0];
    expect(request).toBeDefined();
    const withParam = new URL(request.url).searchParams.get("with") ?? "";
    const requested = withParam.split(",");

    for (const relation of FLOOR_RELATIONS) {
      expect(requested).toContain(relation);
    }
  });
});
