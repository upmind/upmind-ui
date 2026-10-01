// -----------------------------------------------------------------------------
/**
 * @fileoverview useAffiliatePayoutDestinationManager.machine — the payout
 * manager config's ADR-021 unit-spec load-order case, promoted to
 * integration (G11-EXEC, review-notes.md 2026-09-29).
 *
 * ## Job To Be Done
 * Protect the documented `loading` load order (design.md §8.6: "First it
 * reads the affiliate account of the pinned id ... Then it reads the
 * destinations ... and the unpaged emails in parallel. Then it seeds from
 * the account.") — the raw account GET must complete BEFORE the destinations
 * and emails GETs even START, because the destinations path needs
 * `account.brand_id`. The account is tracked via `request:end` and the
 * destinations/emails routes via `request:start` — tracking all three via
 * `request:end` alone could not tell a genuinely SEQUENTIAL load apart from
 * three requests fired in PARALLEL where the account's own reply just
 * happened to land first; a parallel-fire mutant would stay green under
 * that weaker shape.
 *
 * ## What Breaks If These Fail
 * A destinations read that fires before the account read resolves would
 * request the wrong (or an undefined) brand id, since `brandId =
 * affiliate.account.brand_id` (design.md §8.1).
 *
 * ## Real capture used
 * The real account, destinations and emails captures this unit recorded
 * (`affiliate.destinations.int.test.ts`'s own captures) — never a
 * hand-authored body.
 *
 * ## The save-order case (pseudo-Nathan review pass 20, cardinal call 1)
 * `useAffiliatePayoutDestinationManager.machine.refresh-before-refetch.must-fail.patch`
 * targets the ORDER of `REFRESH` after a successful `update` (design.md §8.6:
 * "the manager invalidates ... and awaits the returned promise ... Then the
 * manager sends `REFRESH`"; design.md §8.4: "`invalidateQueryByKey` uses
 * `refetchType: 'all'`, so the promise resolves after the refetch ... Then
 * the manager sends `REFRESH`"). The pass-20 timestamp assertion
 * (`accountGetStartTimes.some(t => t >= putEndAt)`) could not fail on this
 * order: in this unit's single-composable setup the invalidate step has no
 * live observer to refetch, so it produces NO account GET at all — the one
 * GET the old assertion saw was always REFRESH's own raw re-seed read, which
 * fires strictly after the PUT regardless of whether `REFRESH` is sent before
 * or after the invalidate promise resolves. A timestamp that can only ever be
 * later proves nothing about order (pseudo-Nathan review pass 20 quotable).
 *
 * Fixed: a SECOND, live `useClientAffiliate` instance is opened on the same
 * account before the save, so it holds a real cache entry for the account
 * key design.md §8.4 names — `invalidateQueryByKey`'s `refetchType: "all"`
 * now has something to refetch, and that refetch becomes an observable
 * request (design.md's own risk table: "a spec can see two or more account
 * GETs after the payout save" once a live observer exists). The proof holds
 * every post-setup account GET open with `holdCapture` (never resolves until
 * released) and counts `request:start` events on that route. If `update()`
 * awaits the invalidate-triggered refetch before sending `REFRESH`, no SECOND
 * account GET can start while the first is held — `REFRESH`'s own raw
 * re-seed read has nothing to fire yet. A mutant that sends `REFRESH` before
 * the invalidate promise resolves fires that second raw GET immediately,
 * so a second `request:start` lands on the SAME held gate before release.
 * This is a deterministic hold/release, not a wall-clock race: MSW replay
 * resolves fixture bodies in well under 1ms, so two scratch probes this pass
 * (patch-free, and with the patch applied) each showed all three post-save
 * GETs start within the SAME millisecond — timestamps alone cannot order
 * them; only holding one open can.
 *
 * **Control:** the retargeted
 * `useAffiliatePayoutDestinationManager.machine.refresh-before-refetch.must-fail.patch`
 * drops the await on the invalidate promise. Blind-run pass 22: the save-order
 * assertion `expect(accountGetStarts).toBe(1)` flips (`expected 2 to be 1`),
 * the load-order test stays green, and the revert is GREEN. History:
 * CONTROLS.md.
 *
 * Stated omissions (ADR-021, design.md §8.2): this spec sends no write and
 * asserts no failure branch of its own.
 */
import { describe, expect, it } from "vitest";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useAffiliatePayoutDestinationManager } from "../useAffiliatePayoutDestinationManager";
import { useClientAffiliate } from "../useClientAffiliate";
import {
  holdCapture,
  inputAndSettle,
  recordedAffiliateAccountBrandId,
  seedRealClient,
  serveCapture,
  withBound
} from "./affiliate.int-helpers";
import { recorded, server } from "./setup.integration";

// -----------------------------------------------------------------------------

type SavePutResponseBody = {
  data?: {
    affiliate_payout_destination_id?: string;
    affiliate_payout_paypal_email_id?: string | null;
  };
};

/** Read from the recorded non-PayPal save capture — never a hand-copied literal. */
function recordedNonPaypalSave(): { destinationId: string; emailId: null } {
  const account = recorded<SavePutResponseBody>(
    "put-accounts-id-case-non-paypal-save"
  ).data;
  const destinationId = account?.affiliate_payout_destination_id;
  if (!destinationId) {
    throw new Error(
      "[useAffiliatePayoutDestinationManager.machine] the recorded non-PayPal save capture carries no destination id."
    );
  }
  return { destinationId, emailId: null };
}

// -----------------------------------------------------------------------------

describe("useAffiliatePayoutDestinationManager.machine — loading reads the account before the destinations and the emails", () => {
  it("the raw account GET resolves before the destinations and emails GETs fire", async () => {
    await seedRealClient();

    const order: string[] = [];
    server?.events.on("request:end", ({ request }) => {
      const path = new URL(request.url).pathname;
      if (/\/affiliate$/.test(path)) order.push("account");
    });
    server?.events.on("request:start", ({ request }) => {
      const path = new URL(request.url).pathname;
      if (path.includes("/affiliate_payout_destination"))
        order.push("destinations");
      if (path.includes("/emails")) order.push("emails");
    });

    const manager = useAffiliatePayoutDestinationManager()
      .as(ScopeActorTypes.CLIENT)
      .fresh();
    try {
      await manager.useActions().isReady();

      expect(order[0]).toBe("account");
      expect(order.slice(1)).toEqual(
        expect.arrayContaining(["destinations", "emails"])
      );
      expect(
        manager
          .useContext()
          .destinations.value?.some(
            destination =>
              destination.brand_id === recordedAffiliateAccountBrandId()
          )
      ).toBe(true);
    } finally {
      manager.useActions().destroy();
    }
  });

  it("REFRESH's own account re-read never starts before the invalidate-triggered refetch is released", async () => {
    await seedRealClient();

    const liveAffiliate = useClientAffiliate().as(ScopeActorTypes.CLIENT);
    const manager = useAffiliatePayoutDestinationManager()
      .as(ScopeActorTypes.CLIENT)
      .fresh();
    try {
      await liveAffiliate.useActions().isReady();
      await manager.useActions().isReady();

      const { destinationId: nonPaypalId, emailId: nonPaypalEmailId } =
        recordedNonPaypalSave();
      await inputAndSettle(manager, {
        payoutDestinationId: nonPaypalId,
        paypalEmailId: nonPaypalEmailId
      });

      serveCapture<
        SavePutResponseBody,
        { affiliate_payout_destination_id?: string }
      >(
        "put",
        "*/api/accounts/:accountId",
        "put-accounts-id-case-non-paypal-save",
        {
          bodyMatch: body =>
            body.affiliate_payout_destination_id === nonPaypalId
        }
      );

      let accountGetStarts = 0;
      server?.events.on("request:start", ({ request }) => {
        const path = new URL(request.url).pathname;
        if (request.method === "GET" && /\/affiliate$/.test(path))
          accountGetStarts += 1;
      });

      const held = holdCapture(
        "get",
        "*/api/accounts/:accountId/affiliate",
        "get-accounts-id-affiliate-with-staged-imports-1"
      );

      const updatePromise = manager.useActions().update();

      // Give the invalidate-triggered refetch a chance to start while its
      // response stays held — design.md §8.4: the promise `invalidate`
      // returns "resolves after the refetch", so `update()` cannot reach the
      // `REFRESH` send while that refetch's own response is still pending.
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(accountGetStarts).toBe(1);

      held.release();
      await withBound(
        updatePromise,
        3000,
        "[useAffiliatePayoutDestinationManager.machine] update()"
      );

      expect(accountGetStarts).toBeGreaterThan(1);
      const reReadDestinationId = recorded<{
        data?: { account?: { affiliate_payout_destination_id?: string } };
      }>("get-accounts-id-affiliate-with-staged-imports-1").data?.account
        ?.affiliate_payout_destination_id;
      expect(reReadDestinationId).toBeTruthy();
      expect(reReadDestinationId).not.toBe(nonPaypalId);
      await expect
        .poll(() => manager.useContext().model.value?.payoutDestinationId)
        .toBe(reReadDestinationId);
      expect(manager.useMeta().hasError.value).toBe(false);
    } finally {
      manager.useActions().destroy();
    }
  });
});
