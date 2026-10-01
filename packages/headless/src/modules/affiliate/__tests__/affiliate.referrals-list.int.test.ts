// -----------------------------------------------------------------------------
/**
 * @fileoverview affiliate.referrals-list — the referrals read for the active
 * account (@AC14 read/failure half; AC15's filter/sort/paginate half stays
 * `@todo` in affiliate.feature — this account carries exactly 3 real rows
 * against a default page size of 5, so no real page boundary can be
 * captured; see the module hand-off)
 *
 * ## Job To Be Done
 * Protect that `useAffiliateReferrals` reads the active account's own
 * referrals, with the documented relations on the wire and no
 * `with_staged_imports` (design.md §8.1: "No `with_staged_imports` [o24]"),
 * and reports the read failure honestly (design.md §8.2 Failure surface).
 *
 * ## What Breaks If These Fail
 * A client would see the wrong referral count or list, or a transient API
 * failure would look like "you have never referred anyone".
 *
 * Stated omissions (ADR-021, design.md §8.2): this spec's failure case is the
 * documented 500-only 4xx/5xx surface for the four listing reads — no other
 * 4xx is a module code path for a read with no body.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useAffiliateActiveAccount } from "../useAffiliateActiveAccount";
import { useAffiliateReferrals } from "../useAffiliateReferrals";
import {
  recordedAccountId,
  seedRealClient,
  serveFailure
} from "./affiliate.int-helpers";
import { recorded, server } from "./setup.integration";

// -----------------------------------------------------------------------------

const REFERRALS_ROUTE = "*/api/accounts/:accountId/affiliate/referrals";
const REFERRALS_FIXTURE = "get-accounts-id-affiliate-referrals";

type ReferralsBody = { data?: { id?: string }[] };

function recordedReferralIds(): (string | undefined)[] {
  return (recorded<ReferralsBody>(REFERRALS_FIXTURE).data ?? []).map(r => r.id);
}

describe("affiliate.referrals-list — the referrals read for the active account", () => {
  beforeEach(async () => {
    await seedRealClient();
  });

  it("reads the active account's own referrals, with the documented relations on the wire and no with_staged_imports", async () => {
    // The resolver must publish the active account BEFORE this collection is
    // built — a collection's own `isReady()` settles at once, with zero rows
    // and zero requests, while `keyAccountId` is still undefined (design.md
    // §8.4 Consumers), exactly as the landed `affiliate.no-account` spec
    // awaits the resolver first.
    await useAffiliateActiveAccount()
      .as(ScopeActorTypes.CLIENT)
      .useActions()
      .isReady();

    const seen: string[] = [];
    server?.events.on("request:start", ({ request }) => {
      const url = new URL(request.url);
      if (url.pathname.endsWith("/affiliate/referrals")) {
        seen.push(`${url.pathname}${url.search}`);
      }
    });

    const accountId = recordedAccountId();
    const referrals = useAffiliateReferrals().as(ScopeActorTypes.CLIENT);
    await referrals.useActions().isReady();

    // Read from the recorded referrals capture itself, never a hand-copied
    // literal.
    const rows = referrals.useContext().data.value;
    expect(rows).toHaveLength(3);
    expect(rows.map(r => r.id)).toEqual(recordedReferralIds());
    expect(rows[0].created_at).toBe("2026-09-29 18:37:21");

    expect(seen).toHaveLength(1);
    expect(seen[0]).toContain(`/accounts/${accountId}/affiliate/referrals`);
    for (const relation of [
      "affiliate_account",
      "affiliate_link",
      "client",
      "client.image"
    ]) {
      expect(seen[0]).toContain(relation);
    }
    expect(seen[0]).not.toContain("with_staged_imports");
    // design.md §8.11 `size-ten`: the schema's default page size is 5, not
    // the mock's 10 — this account's 3 real rows never force a real page
    // boundary, so the default `limit` itself is the only provable half.
    expect(seen[0]).toContain("limit=5");
  });

  it("reports a failed referrals read, and a refresh asks again", async () => {
    await useAffiliateActiveAccount()
      .as(ScopeActorTypes.CLIENT)
      .useActions()
      .isReady();
    serveFailure("get", REFERRALS_ROUTE);

    const referrals = useAffiliateReferrals().as(ScopeActorTypes.CLIENT);
    await referrals.useActions().isReady();

    expect(referrals.useMeta().hasError.value).toBe(true);
    expect(referrals.useContext().error.value).toBeTruthy();
    expect(referrals.useContext().data.value).toEqual([]);

    // Remove the failure override before the refresh — bdd.md AC14 asks a
    // refresh again, of the real read, not of the same forced failure.
    server?.resetHandlers();

    const seen: string[] = [];
    server?.events.on("request:start", ({ request }) => {
      const url = new URL(request.url);
      if (url.pathname.endsWith("/affiliate/referrals"))
        seen.push(url.pathname);
    });

    await referrals.useActions().refresh();

    expect(seen).toHaveLength(1);
    expect(referrals.useMeta().hasError.value).toBe(false);
    expect(referrals.useContext().data.value).toHaveLength(3);
  });
});

// The page-mount-order race (F-2) is proven generically, over
// useAffiliateLinks, by affiliate.boot-order.int.test.ts's own
// bootFreshRealm scenario — not restated here.
