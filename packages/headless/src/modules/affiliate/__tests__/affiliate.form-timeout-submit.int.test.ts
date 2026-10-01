// -----------------------------------------------------------------------------
/**
 * @fileoverview affiliate — each manager's save wait is BOUNDED against a write
 * that never answers (design.md §8.4 rule 6, §8.6 "saving")
 *
 * ## Job To Be Done
 * Prove each manager's `update()` rejects with a CATCHABLE, real, translated
 * form-timeout error once its own save bound passes — never hangs forever, and
 * never surfaces the bare i18n key. The editor is opened and ready, the write
 * is observed to leave, and its response never returns. A fake clock walks past
 * the bound, so the spec costs no wall time.
 *
 * ## What Breaks If These Fail
 * A client who saves behind a write that never answers watches a spinner for
 * ever, with nothing a consumer can catch or show.
 *
 * ## Why this is its OWN file
 * It owns the fake clock and the never-answered write route. The readiness bound
 * lives in `affiliate.form-timeout.int.test.ts`, on real timers.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { http } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useAffiliateActiveAccount } from "../useAffiliateActiveAccount";
import { useAffiliateLinkManager } from "../useAffiliateLinkManager";
import { useAffiliatePayoutDestinationManager } from "../useAffiliatePayoutDestinationManager";
import { inputAndSettle, seedRealClient } from "./affiliate.int-helpers";
import { recorded, server } from "./setup.integration";

// -----------------------------------------------------------------------------

const errorEn = JSON.parse(
  readFileSync(
    join(import.meta.dirname, "../../../../../i18n/src/core/error-en.json"),
    "utf-8"
  )
) as Record<string, string>;

type DestinationsBody = { data?: { id?: string; code?: string }[] };

const WALK_MS = [1000, 14000, 16000, 30000, 60000, 120000];

type Outcome =
  | { kind: "pending" }
  | { kind: "resolved" }
  | { kind: "rejected"; message: string };

async function walkClock(
  save: () => Promise<unknown>
): Promise<{ afterOneSecond: Outcome; final: Outcome }> {
  let outcome: Outcome = { kind: "pending" };
  save().then(
    () => {
      outcome = { kind: "resolved" };
    },
    error => {
      outcome = {
        kind: "rejected",
        message: String((error as Error)?.message)
      };
    }
  );
  await vi.advanceTimersByTimeAsync(WALK_MS[0]);
  const afterOneSecond = outcome;
  for (const step of WALK_MS.slice(1)) {
    if (outcome.kind !== "pending") break;
    await vi.advanceTimersByTimeAsync(step);
  }
  return { afterOneSecond, final: outcome };
}

describe("affiliate managers — every save wait is bounded", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("the link manager's save rejects with its real translated form-timeout text once the write never answers", async () => {
    await seedRealClient();
    await useAffiliateActiveAccount()
      .as(ScopeActorTypes.CLIENT)
      .useActions()
      .isReady();

    const manager = useAffiliateLinkManager()
      .as(ScopeActorTypes.CLIENT)
      .fresh();
    try {
      await manager.useActions().isReady();
      await inputAndSettle(manager, {
        name: "timeout-probe",
        redirectUrl: "https://example.com"
      });

      const writes: string[] = [];
      server?.events.on("request:start", ({ request }) => {
        if (
          request.method === "POST" &&
          request.url.includes("/affiliate/links")
        )
          writes.push(request.url);
      });
      server?.use(
        http.post("*/affiliate/links", () => new Promise<never>(() => {}))
      );

      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
      const { afterOneSecond, final } = await walkClock(() =>
        manager.useActions().update()
      );

      expect(writes).toHaveLength(1);
      expect(afterOneSecond.kind).toBe("pending");
      expect(final).toEqual({
        kind: "rejected",
        message: errorEn.affiliate_link_form_timeout
      });
    } finally {
      vi.useRealTimers();
      manager.useActions().destroy();
    }
  });

  it("the payout manager's save rejects with its real translated form-timeout text once the write never answers", async () => {
    await seedRealClient();
    await useAffiliateActiveAccount()
      .as(ScopeActorTypes.CLIENT)
      .useActions()
      .isReady();

    const manager = useAffiliatePayoutDestinationManager()
      .as(ScopeActorTypes.CLIENT)
      .fresh();
    try {
      await manager.useActions().isReady();
      const walletId = recorded<DestinationsBody>(
        "get-brands-id-affiliate-payout-destination"
      ).data?.find(destination => destination.code === "wallet")?.id;
      if (!walletId) {
        throw new Error(
          "[affiliate.form-timeout-submit] the recorded destinations capture carries no non-PayPal destination."
        );
      }
      await inputAndSettle(manager, {
        payoutDestinationId: walletId,
        paypalEmailId: null
      });

      const writes: string[] = [];
      server?.events.on("request:start", ({ request }) => {
        if (request.method === "PUT") writes.push(request.url);
      });
      server?.use(
        http.put(
          "*/api/accounts/:accountId",
          () => new Promise<never>(() => {})
        )
      );

      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
      const { afterOneSecond, final } = await walkClock(() =>
        manager.useActions().update()
      );

      expect(writes).toHaveLength(1);
      expect(afterOneSecond.kind).toBe("pending");
      expect(final).toEqual({
        kind: "rejected",
        message: errorEn.affiliate_payout_destination_form_timeout
      });
    } finally {
      vi.useRealTimers();
      manager.useActions().destroy();
    }
  });
});
