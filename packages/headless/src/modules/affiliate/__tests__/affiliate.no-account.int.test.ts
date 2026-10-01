// -----------------------------------------------------------------------------
/**
 * @fileoverview affiliate.no-account — with no account, the client
 * composables send nothing, and the visit still goes (@AC34, no-account half)
 *
 * ## Job To Be Done
 * Protect the zero-account edge (design.md §8.4 rule 5, §8.12): a client
 * session with zero affiliate accounts gets no active account, and every
 * client composable reports `isAvailable` false with zero affiliate
 * requests — the module never sends a request it has no account to
 * address.
 *
 * ## What Breaks If These Fail
 * A zero-account client would either get stuck showing a chooser for
 * accounts that don't exist, or a composable would send a request with an
 * undefined/empty account segment in its path.
 *
 * Declared override (design.md §8.9): "a client with zero accounts" —
 * `accounts` set to `[]` on the REAL recorded `self` capture's session seed,
 * built at this spec's own call site, never a separate capture.
 *
 * ## ADR-035 scope note (session-store seed, not a recording flip)
 * Design.md §8.9's own override table names this row against the `self` base
 * capture with the override landing "in the session seed", never on a served
 * response — distinct from the withdraw-setting/balance overrides ADR-035
 * removed, which patched a SERVED response body (`serveOverride`/
 * `serveCapture`'s `patch`). This spec's `accounts: []` override never
 * reaches MSW; it only shapes the local session-store actor object the test
 * seeds, the same way every spec here fabricates its own session token. Zero
 * affiliate accounts is a genuinely reachable client state (AC34), not a
 * fabricated business outcome.
 *
 * Stated omissions (ADR-021, design.md §8.2): this spec sends no write and
 * asserts no failure branch of its own.
 *
 * ## Capture gap (G3, honestly disclosed)
 * The "visit while the select call is held" half of AC34 needs Seed A2 (a
 * client session with two accounts, so a select POST is genuinely in
 * flight) — no known staging credential has one (see
 * `affiliate.fixtures.ts`'s header). That half stays `@todo` in
 * `affiliate.feature`.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { AccessRoleTypes } from "@upmind-automation/types";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useSessionStore, mapSessionUser } from "../../session-store";
import { useAffiliateActiveAccount } from "../useAffiliateActiveAccount";
import { useAffiliateCommissions } from "../useAffiliateCommissions";
import { useAffiliateLinkManager } from "../useAffiliateLinkManager";
import { useAffiliateLinks } from "../useAffiliateLinks";
import { useAffiliateLinkVisit } from "../useAffiliateLinkVisit";
import { useAffiliatePayoutDestinationManager } from "../useAffiliatePayoutDestinationManager";
import { useAffiliatePayouts } from "../useAffiliatePayouts";
import { useAffiliateReferrals } from "../useAffiliateReferrals";
import { useClientAffiliate } from "../useClientAffiliate";
import { recordedSelf, serveFailure } from "./affiliate.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

const LATE_REQUEST_WINDOW_MS = 1000;

async function seedZeroAccountClient(): Promise<void> {
  const self = { ...recordedSelf(), accounts: [] };
  await useSessionStore()
    .useActions()
    .add(
      {
        access_token: "affiliate-int-test-session-token",
        actor_id: self.actor_id,
        actor_type: AccessRoleTypes.CLIENT,
        expires_in: 3600,
        refresh_expires_in: 36000,
        refresh_token: "affiliate-int-test-refresh-token",
        second_factor_required: false,
        token_type: "Bearer",
        twofa_provider: undefined as never
      },
      true,
      mapSessionUser(self)
    );
}

describe("affiliate.no-account — with no account, the client composables send nothing, and the visit still goes", () => {
  beforeEach(async () => {
    await seedZeroAccountClient();
  });

  it("a zero-account client gets no active account", async () => {
    const resolver = useAffiliateActiveAccount().as(ScopeActorTypes.CLIENT);
    await resolver.useActions().isReady();

    expect(resolver.useContext().activeAccountId.value).toBeUndefined();
  });

  it("with no account, the client composables send nothing, and the visit still goes — every client composable is unavailable with zero requests on its own paths", async () => {
    const seen: string[] = [];
    server?.events.on("request:start", ({ request }) => {
      const path = new URL(request.url).pathname;
      if (path.includes("/accounts/") || path.includes("/affiliate")) {
        seen.push(`${request.method} ${path}`);
      }
    });

    await useAffiliateActiveAccount()
      .as(ScopeActorTypes.CLIENT)
      .useActions()
      .isReady();

    const affiliate = useClientAffiliate().as(ScopeActorTypes.CLIENT);
    const links = useAffiliateLinks().as(ScopeActorTypes.CLIENT);
    const linkManager = useAffiliateLinkManager()
      .as(ScopeActorTypes.CLIENT)
      .fresh();
    const referrals = useAffiliateReferrals().as(ScopeActorTypes.CLIENT);
    const commissions = useAffiliateCommissions().as(ScopeActorTypes.CLIENT);
    const payouts = useAffiliatePayouts().as(ScopeActorTypes.CLIENT);
    const payoutManager = useAffiliatePayoutDestinationManager()
      .as(ScopeActorTypes.CLIENT)
      .fresh();

    try {
      // Settle every composable's own boot work before reading `seen` — a
      // mutant that drops the actor/account guard still sends its request
      // asynchronously, and a same-tick read would stay green over it.
      await Promise.all([
        affiliate.useActions().isReady(),
        links.useActions().isReady(),
        referrals.useActions().isReady(),
        commissions.useActions().isReady(),
        payouts.useActions().isReady()
      ]);

      // The hand-written list is deliberate (design.md AC34, bdd.md "the
      // seven client composables"): a dropped composable reddens this
      // assertion.
      expect(
        [
          affiliate.useMeta().isAvailable.value,
          links.useMeta().isAvailable.value,
          linkManager.useMeta().isAvailable.value,
          referrals.useMeta().isAvailable.value,
          commissions.useMeta().isAvailable.value,
          payouts.useMeta().isAvailable.value,
          payoutManager.useMeta().isAvailable.value
        ],
        "each client composable's isAvailable, in the order listed"
      ).toEqual([false, false, false, false, false, false, false]);

      // Absence cannot be awaited on. A composable that skips the account
      // guard sends its read after its own readiness resolves, so the
      // observer must outlive that late request before it is read.
      await new Promise(resolve => setTimeout(resolve, LATE_REQUEST_WINDOW_MS));

      expect(seen).toEqual([]);
    } finally {
      linkManager.useActions().destroy();
      payoutManager.useActions().destroy();
    }
  });

  it("the guest visit still sends its POST with no Authorization header, with no account resolved", async () => {
    // This case proves the REQUEST shape only (no Authorization header, with
    // no account resolved) — a control response, not the real visit capture
    // `affiliate.link-visit.int.test.ts` already owns for AC24's success
    // path (code-tests.companion.md: "Control and error responses are
    // exempt" from the recorded-only law). It never asserts on a response
    // body of its own.
    serveFailure("post", "*/api/affiliate_link/visit", 500);

    const seenAuth: (string | null)[] = [];
    server?.events.on("request:start", ({ request }) => {
      if (new URL(request.url).pathname.endsWith("/affiliate_link/visit")) {
        seenAuth.push(request.headers.get("Authorization"));
      }
    });

    const visit = useAffiliateLinkVisit().as(ScopeActorTypes.GUEST);
    await visit.useActions().visit();

    expect(seenAuth.length).toBeGreaterThan(0);
    expect(seenAuth[0]).toBeNull();
  });
});
