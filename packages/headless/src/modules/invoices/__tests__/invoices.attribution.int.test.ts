// -----------------------------------------------------------------------------
/**
 * @fileoverview invoices — co-mingled row attribution and the not-settleable
 * signal (AC-13)
 *
 * ## Job To Be Done
 * Prove each mapped row resolves to exactly one of own / sub-account /
 * delegated, that a sub-account row wins over the delegated marking when both
 * inputs are present (child-first, `belongsToChildOfClient` `oracle:137-142`
 * / `belongsToDelegate` `oracle:143-146`), that `isDelegated` is gated on the
 * ABSENCE of any recorded parent — not on that parent matching the reader —
 * matching the oracle, and that a delegated row reports itself as not
 * settleable.
 *
 * ## Provenance
 * This staging account's real invoice history carries no sub-account or
 * delegated row (`invoices.fixtures.ts`'s disclosure log) — its own client
 * relationships are plain. Every scenario here is `recorded.unpaid()` (a REAL
 * recorded row) with an EXPLICITLY LABELLED, minimal set of attribution
 * fields (`client.parent_client_config`, `delegate_related`) toggled per the
 * accepted precedent (`client-email-history.mappers.test.ts`); everything
 * else on the row — payments, category, amounts — stays the real capture.
 *
 * ## What Breaks If These Fail
 * A client is offered "pay" on an invoice that belongs to someone else, or
 * cannot tell a delegator's invoice from their own — this row's the FE-2824
 * shape at the mapping layer, per `parity.yaml` row R02.
 */

import { describe, expect, it, vi } from "vitest";
import { useInvoice } from "..";
import {
  installInvoiceHandlers,
  recorded,
  seedClientSession
} from "./invoices.int-helpers";
import type { WireInvoice } from "./invoices.int-helpers";
import "./setup.integration";

// -----------------------------------------------------------------------------

async function mapWith(
  overrides:
    | Partial<WireInvoice>
    | ((readingClientId: string) => Partial<WireInvoice>)
) {
  const { clientId } = await seedClientSession();
  const handlers = installInvoiceHandlers();
  const resolved =
    typeof overrides === "function" ? overrides(clientId) : overrides;
  const row: WireInvoice = { ...recorded.unpaid(), ...resolved };
  handlers.setOneBody({
    status: "ok",
    data: row,
    total: null,
    error: null,
    messages: null,
    meta: null
  });
  const single = useInvoice().withId(row.id);
  await vi.waitFor(() => expect(single.useMeta().isLoading.value).toBe(false));
  return single.useContext().data.value!;
}

// -----------------------------------------------------------------------------

describe("invoices — attribute each invoice in a co-mingled list (AC-13)", () => {
  it("AC-13 (constructed — no toggle) a row with neither attribution input resolves as my own", async () => {
    const mapped = await mapWith(readingClientId => ({
      delegate_related: false,
      client: { id: readingClientId, parent_client_config: null }
    }));
    expect(mapped.attribution.isOwn).toBe(true);
    expect(mapped.attribution.isChildOfClient).toBe(false);
    expect(mapped.attribution.isDelegated).toBe(false);
  });

  it("AC-13 (constructed — client.parent_client_config toggled) a sub-account row resolves as a sub-account, not my own", async () => {
    const mapped = await mapWith(readingClientId => ({
      delegate_related: false,
      client: {
        id: "child-client",
        parent_client_config: { parent_client_id: readingClientId }
      }
    }));
    expect(mapped.attribution.isChildOfClient).toBe(true);
    expect(mapped.attribution.isOwn).toBe(false);
  });

  it("AC-13 (constructed — delegate_related toggled) a delegated row resolves as delegated", async () => {
    const mapped = await mapWith({
      delegate_related: true,
      client: { id: "delegator-client", parent_client_config: null }
    });
    expect(mapped.attribution.isDelegated).toBe(true);
    expect(mapped.attribution.isOwn).toBe(false);
  });

  it("AC-13 (constructed — BOTH inputs toggled) a sub-account row wins over the delegated marking when both are present (child-first)", async () => {
    const mapped = await mapWith(readingClientId => ({
      delegate_related: true,
      client: {
        id: "child-client",
        parent_client_config: { parent_client_id: readingClientId }
      }
    }));
    expect(mapped.attribution.isChildOfClient).toBe(true);
    expect(mapped.attribution.isDelegated).toBe(false);
  });

  it("AC-13 (constructed — parent is SOME OTHER client, not the reader, AND delegate_related toggled) follows the oracle: ANY recorded parent excludes isDelegated, even one that is not the reader", async () => {
    const mapped = await mapWith({
      delegate_related: true,
      client: {
        id: "grandchild-client",
        parent_client_config: { parent_client_id: "some-other-client-entirely" }
      }
    });
    expect(mapped.attribution.isChildOfClient).toBe(false);
    expect(mapped.attribution.isDelegated).toBe(false);
    expect(mapped.attribution.isOwn).toBe(true);
  });
});

describe("invoices — a delegated invoice is not mine to settle (AC-13)", () => {
  it("AC-13 (constructed — delegate_related toggled) a delegated row reports itself as NOT settleable", async () => {
    const mapped = await mapWith({
      delegate_related: true,
      client: { id: "delegator-client", parent_client_config: null }
    });
    expect(mapped.attribution.isSettleable).toBe(false);
  });

  it("AC-13 (constructed — no toggle) a row that is my own carries no such restriction", async () => {
    const mapped = await mapWith({
      delegate_related: false,
      client: { id: "reading-client", parent_client_config: null }
    });
    expect(mapped.attribution.isSettleable).toBe(true);
  });
});
