// -----------------------------------------------------------------------------
/**
 * @fileoverview affiliate.commissions-list — the pending-commissions read
 * for the active account (@AC16 read/failure half; AC17's filter/sort/
 * paginate half stays `@todo` in affiliate.feature — this account carries
 * exactly 2 real rows, no real page boundary to prove; see the module
 * hand-off)
 *
 * ## Job To Be Done
 * Protect that `useAffiliateCommissions` reads the active account's own
 * pending commissions, with `with_staged_imports=1` on the wire (design.md
 * §8.1), and reports the read failure honestly (design.md §8.2 Failure
 * surface).
 *
 * ## What Breaks If These Fail
 * A client would see the wrong (or no) pending commission history, or a
 * transient API failure would look like "you have no pending commissions".
 *
 * Stated omissions (ADR-021, design.md §8.2): this spec's failure case is the
 * documented 500-only 4xx/5xx surface for the four listing reads — no other
 * 4xx is a module code path for a read with no body.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useAffiliateActiveAccount } from "../useAffiliateActiveAccount";
import { useAffiliateCommissions } from "../useAffiliateCommissions";
import {
  recordedAccountId,
  seedRealClient,
  serveFailure
} from "./affiliate.int-helpers";
import { recorded, server } from "./setup.integration";

// -----------------------------------------------------------------------------

const COMMISSIONS_ROUTE =
  "*/api/accounts/:accountId/affiliate/pending_commissions";
const COMMISSIONS_FIXTURE =
  "get-accounts-id-affiliate-pending-commissions-with-staged-imports-1";

type CommissionsBody = {
  data?: { id?: string; amount?: number; amount_formatted?: string }[];
};

function recordedCommissionRows(): {
  id?: string;
  amount?: number;
  amount_formatted?: string;
}[] {
  return recorded<CommissionsBody>(COMMISSIONS_FIXTURE).data ?? [];
}

describe("affiliate.commissions-list — the pending-commissions read for the active account", () => {
  beforeEach(async () => {
    await seedRealClient();
  });

  it("reads the active account's own pending commissions, with with_staged_imports=1 on the wire", async () => {
    // The resolver must publish the active account BEFORE this collection is
    // built (design.md §8.4 Consumers) — see `affiliate.no-account`.
    await useAffiliateActiveAccount()
      .as(ScopeActorTypes.CLIENT)
      .useActions()
      .isReady();

    const seen: string[] = [];
    server?.events.on("request:start", ({ request }) => {
      const url = new URL(request.url);
      if (url.pathname.endsWith("/affiliate/pending_commissions")) {
        seen.push(`${url.pathname}${url.search}`);
      }
    });

    const accountId = recordedAccountId();
    const commissions = useAffiliateCommissions().as(ScopeActorTypes.CLIENT);
    await commissions.useActions().isReady();

    // Read from the recorded pending-commissions capture itself, never a
    // hand-copied literal — a re-record never silently drifts this stale.
    const recordedRows = recordedCommissionRows();
    const rows = commissions.useContext().data.value;
    expect(rows).toHaveLength(2);
    expect(rows.map(r => r.id)).toEqual(recordedRows.map(r => r.id));
    expect(rows[0].amount).toBe(recordedRows[0]?.amount);
    expect(rows[0].amount_formatted).toBe(recordedRows[0]?.amount_formatted);

    expect(seen).toHaveLength(1);
    expect(seen[0]).toContain(
      `/accounts/${accountId}/affiliate/pending_commissions`
    );
    expect(seen[0]).toContain("with_staged_imports=1");
    for (const relation of ["invoice", "invoice.client"]) {
      expect(seen[0]).toContain(relation);
    }
  });

  it("reports a failed pending-commissions read, and a refresh asks again", async () => {
    await useAffiliateActiveAccount()
      .as(ScopeActorTypes.CLIENT)
      .useActions()
      .isReady();
    serveFailure("get", COMMISSIONS_ROUTE);

    const commissions = useAffiliateCommissions().as(ScopeActorTypes.CLIENT);
    await commissions.useActions().isReady();

    expect(commissions.useMeta().hasError.value).toBe(true);
    expect(commissions.useContext().error.value).toBeTruthy();
    expect(commissions.useContext().data.value).toEqual([]);

    // Remove the failure override before the refresh — bdd.md AC16 asks a
    // refresh again, of the real read, not of the same forced failure.
    server?.resetHandlers();

    const seen: string[] = [];
    server?.events.on("request:start", ({ request }) => {
      const url = new URL(request.url);
      if (url.pathname.endsWith("/affiliate/pending_commissions"))
        seen.push(url.pathname);
    });

    await commissions.useActions().refresh();

    expect(seen).toHaveLength(1);
    expect(commissions.useMeta().hasError.value).toBe(false);
    expect(commissions.useContext().data.value).toHaveLength(2);
  });
});

// The page-mount-order race (F-2) is proven generically, over
// useAffiliateLinks, by affiliate.boot-order.int.test.ts's own
// bootFreshRealm scenario — not restated here.
