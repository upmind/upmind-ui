// -----------------------------------------------------------------------------
/**
 * @fileoverview affiliate.account-read — the affiliate account reads with
 * its relations, and an absent account means not enrolled (@AC2, read half)
 *
 * ## Job To Be Done
 * Protect that the enrolled account read carries every documented relation
 * on the wire (design.md §8.1) and that `useClientAffiliate` publishes the
 * real recorded field values, not a look-alike or a stale shape.
 *
 * ## What Breaks If These Fail
 * A client would see the wrong (or no) affiliate-since date, referral/visit
 * counts, or enrolment status — the account read is the root of every other
 * derived member on this composable.
 *
 * ## Scope narrowed this pass (named, not silently dropped)
 * bdd.md's AC2 row plans THREE scenarios: read, absent account, refetch over
 * loaded data (DV6). This file proves the READ half and, this pass, the DV6
 * refetch half:
 *  - the ABSENT-account half is already proven by
 *    `affiliate.error-reload.int.test.ts`'s "an absent affiliate account is
 *    not an error" case (design.md: "AC25 repeats this case on purpose,
 *    because its read-back names the absent-account bound on each read") —
 *    proving it a second time here would be the same behaviour re-proven at
 *    the same layer, which `/code-test-integration` bars.
 *  - the DV6 "refetch over loaded data" half (design.md §8.11
 *    `loading-on-refetch`: "`isLoading` reads the fetch flag of the query,
 *    not the first-load flag") now has its held-response helper
 *    (`holdCapture`, `affiliate.int-helpers.ts:322`) — proven below by
 *    loading the real account once, then holding the SAME real capture open
 *    on a manual `refresh()` and asserting `isLoading` stays `false`
 *    throughout (only the first-load flag, never the fetch flag, per
 *    design.md §8.1).
 *
 * Stated omissions (ADR-021, design.md §8.2): this spec's only failure case
 * is the documented 404-suppression, proven in `affiliate.error-reload`; no
 * other 4xx/5xx is a module code path for this read.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useClientAffiliate } from "../useClientAffiliate";
import { holdCapture, seedRealClient } from "./affiliate.int-helpers";
import { recorded, server } from "./setup.integration";

// -----------------------------------------------------------------------------

const ACCOUNT_ROUTE = "*/api/accounts/:accountId/affiliate";

type RawAffiliateAccountBody = {
  data?: {
    id?: string;
    account_id?: string;
    disabled?: boolean;
    referral_count?: number;
    link_visit_count?: number;
    staged_import?: boolean;
    account?: {
      brand?: { name?: string };
      affiliate_payout_destination?: { code?: string };
    };
  };
};

describe("affiliate.account-read — the affiliate account reads with its relations, and an absent account means not enrolled", () => {
  beforeEach(async () => {
    await seedRealClient();
  });

  it("the affiliate account reads with its relations, and an absent account means not enrolled", async () => {
    const seen: string[] = [];
    server?.events.on("request:start", ({ request }) => {
      const url = new URL(request.url);
      if (/\/affiliate$/.test(url.pathname))
        seen.push(`${url.pathname}${url.search}`);
    });

    const affiliate = useClientAffiliate().as(ScopeActorTypes.CLIENT);
    await affiliate.useActions().isReady();

    expect(seen).toHaveLength(1);
    expect(seen[0]).toContain("/affiliate?");
    expect(seen[0]).toContain("with_staged_imports=1");
    for (const relation of [
      "account",
      "account.brand",
      "account.clients",
      "import.credentials",
      "import.source",
      "account.affiliate_payout_destination"
    ]) {
      expect(seen[0]).toContain(relation);
    }

    // Read from the recorded capture itself — never a hand-copied literal —
    // so a re-record never silently drifts this spec stale.
    const raw = recorded<RawAffiliateAccountBody>(
      "get-accounts-id-affiliate-with-staged-imports-1"
    ).data;
    const data = affiliate.useContext().data.value;
    expect(data?.id).toBe(raw?.id);
    expect(data?.account_id).toBe(raw?.account_id);
    expect(data?.disabled).toBe(raw?.disabled);
    expect(data?.referral_count).toBe(raw?.referral_count);
    expect(data?.link_visit_count).toBe(raw?.link_visit_count);
    expect(data?.staged_import).toBe(raw?.staged_import);
    expect(data?.account?.brand?.name).toBe(raw?.account?.brand?.name);
    expect(data?.account?.affiliate_payout_destination?.code).toBe(
      raw?.account?.affiliate_payout_destination?.code
    );

    expect(affiliate.useMeta().isEnrolled.value).toBe(true);
    expect(affiliate.useMeta().hasError.value).toBe(false);
  });

  it("a refetch over already-loaded data does not report isLoading — only the first load does (DV6)", async () => {
    const affiliate = useClientAffiliate().as(ScopeActorTypes.CLIENT);
    await affiliate.useActions().isReady();

    expect(affiliate.useMeta().isEnrolled.value).toBe(true);
    expect(affiliate.useMeta().isLoading.value).toBe(false);

    const raw = recorded<RawAffiliateAccountBody>(
      "get-accounts-id-affiliate-with-staged-imports-1"
    ).data;

    const held = holdCapture(
      "get",
      ACCOUNT_ROUTE,
      "get-accounts-id-affiliate-with-staged-imports-1"
    );
    const refreshed = affiliate.useActions().refresh();

    expect(affiliate.useMeta().isLoading.value).toBe(false);
    expect(affiliate.useContext().data.value?.referral_count).toBe(
      raw?.referral_count
    );

    held.release();
    await refreshed;

    expect(affiliate.useMeta().isLoading.value).toBe(false);
    expect(affiliate.useContext().data.value?.referral_count).toBe(
      raw?.referral_count
    );
  });
});
