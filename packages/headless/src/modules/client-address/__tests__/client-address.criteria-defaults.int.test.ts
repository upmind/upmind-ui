// -----------------------------------------------------------------------------
/**
 * @fileoverview the collection's opening request is schema-derived, not
 * hardcoded (integration, AC-43 — FE-3103 D2)
 *
 * ## Job To Be Done
 * Before FE-3103, `useClientAddresses.ts` minted its first list request from a
 * literal `{ pagination: { limit: 0 } }` passed as `loadList()`'s options —
 * but that shape was never one `list()`'s underlying TanStack call recognised,
 * so the literal fell silently into `...options` as an unknown key and was
 * DROPPED. `withPageWindow(undefined)` then supplied its own fallback,
 * `PAGINATION.limit`, which is 10, not 0. The pre-FE-3103 boot read therefore
 * sent `limit=10` on the wire, not the `limit=0` the literal in the source
 * appeared to promise — a client with 11+ addresses silently lost every
 * address past the tenth on first load. D2's read-back is that the opening
 * request now carries the schema's OWN declared `pagination` default —
 * proven here by asserting the wire matches the value `useContext().schemas
 * .query.schema` itself declares, not a literal typed into this test — before
 * any consumer has called a filter or sort action. This diff is a silent FIX
 * of that truncation bug, not a neutral wiring change.
 *
 * `useQuerySchema()` carries no `sort` default — removed on review: no
 * recorded fixture shows the endpoint accepting an `order` column on the boot
 * read, and the oracle audit found legacy never sends one (`parity.yaml`
 * `oracle_audit`). Sort stays fully driveable through `useActions().sortBy()`;
 * only the unrequested default is gone. This file guards that absence too:
 * the opening request must carry no `order` param at all.
 *
 * ## What Breaks If These Fail
 * A future edit to `useQuerySchema()`'s declared `pagination` default silently
 * stops reaching the wire — the schema and the request drift back apart,
 * exactly the gap D2 exists to close. A future edit that re-adds a `sort`
 * default would put an unrecorded `order` back on every boot read, including
 * surfaces that never call `sortBy()` — the drop this update makes.
 */

import { describe, expect, it } from "vitest";
import { useClientAddresses } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installAddressesListHandler,
  observeAddressRequests,
  recordedRows,
  seedClientSession
} from "./client-address.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

describe("client-address — the opening request carries the schema's own declared defaults (AC-43, D2)", () => {
  it("AC-43 asks for no sort order by default — the schema declares none", async () => {
    const { clientId } = await seedClientSession();
    const { primary, secondary } = recordedRows();
    installAddressesListHandler(server, clientId, [primary, secondary]);
    const observed = observeAddressRequests();

    const addresses = useClientAddresses().as(ScopeActorTypes.CLIENT);
    await addresses.useActions().isReady();
    observed.stop();

    const params = new URL(observed.first().url).searchParams;
    expect(params.get("order")).toBeNull();
  });

  it("AC-43 asks for the pagination window useQuerySchema() itself declares — not a value typed into this test", async () => {
    const { clientId } = await seedClientSession();
    const { primary, secondary } = recordedRows();
    installAddressesListHandler(server, clientId, [primary, secondary]);
    const observed = observeAddressRequests();

    const addresses = useClientAddresses().as(ScopeActorTypes.CLIENT);
    await addresses.useActions().isReady();
    observed.stop();

    const pagination = addresses.useContext().schemas.query.schema.properties
      ?.pagination as {
      properties?: {
        limit?: { default?: unknown };
        offset?: { default?: unknown };
      };
    };
    const declaredLimit = pagination.properties?.limit?.default;
    const declaredOffset = pagination.properties?.offset?.default;
    // Both undefined would make the assertions below vacuously true against
    // an empty wire read — guard the schema actually declares defaults first.
    expect(declaredLimit).toBeDefined();
    expect(declaredOffset).toBeDefined();

    const params = new URL(observed.first().url).searchParams;
    expect(params.get("limit")).toBe(String(declaredLimit));
    expect(params.get("offset")).toBe(String(declaredOffset));
  });
});
