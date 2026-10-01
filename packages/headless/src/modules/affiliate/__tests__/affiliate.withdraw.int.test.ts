// -----------------------------------------------------------------------------
/**
 * @fileoverview affiliate.withdraw — a manual withdrawal request raises a
 * real support ticket, whichever message is sent (@AC19)
 *
 * ## Job To Be Done
 * Protect `requestWithdrawal`'s success path (design.md §8.2, §8.5): a
 * successful withdrawal resolves the raised ticket's id, not `undefined`,
 * and this spec asserts the ONE outbound POST to
 * `/accounts/{id}/affiliate/withdraw` carrying the real message, and the
 * real recorded ticket id/reference — not just "resolves something", which
 * alone would stay green under a mutant that fabricates a ticket id with no
 * request ever reaching the wire.
 *
 * ## Operator brief, 2026-09-30 — staging state changed, retitled
 * The brand's withdraw setting was described as ON with a £5.00 available
 * balance. A real message now succeeds (200, a real ticket) — the prior
 * "refused with the real 409" title (pass 6) no longer describes reality,
 * retitled to what is now actually observed.
 *
 * ## The empty-message case is a declared control, not a second real capture
 * A live probe this pass found this account/brand no longer refuses an
 * empty message server-side either (200, a second real ticket) — recording
 * that for real would raise a SECOND real support ticket, over the
 * operator's one-ticket budget for this pass. The AC19 failure branch
 * (design.md §8.2 Failure surface: "the real 422 to an empty message") is
 * proven below by a declared `serveFailure(422)` control instead — the same
 * pattern `affiliate.destination-save.int.test.ts` already uses for its own
 * refused-save case (code-tests.companion.md: "Control and error responses
 * are exempt" from the recorded-only law) — never a recorded body standing
 * in for what this account no longer actually refuses.
 *
 * ## Named contradiction (surfaced, not silently resolved — see
 * `affiliate.withdraw-gate.int.test.ts`'s own header for the full account)
 * The withdraw ACTION succeeding here does NOT mean the client-side
 * `canWithdraw` gate reads true: the real recorded
 * `AFFILIATES_WITHDRAW_REQUEST` config-brand-values capture is STILL
 * `{"data": []}` (unset), even fetched with an explicit `brand_id` (probed
 * live this pass, outside the generator, to rule out a missing-parameter
 * cause). The server accepting the write is independent of the client-side
 * config gate the composable reads for `canWithdraw` — a genuine, real
 * divergence between "the brand's withdraw REQUEST setting reads ON to this
 * client" (operator's description) and "the withdraw ENDPOINT accepts a
 * request" (what this spec proves). This spec proves the latter only.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useClientAffiliate } from "../useClientAffiliate";
import {
  seedRealClient,
  serveCapture,
  serveFailure
} from "./affiliate.int-helpers";
import { recorded, server } from "./setup.integration";

// -----------------------------------------------------------------------------

const WITHDRAW_ROUTE = "*/api/accounts/:accountId/affiliate/withdraw";

type RawWithdrawTicketBody = { data?: { id?: string } };

describe("affiliate.withdraw — a manual withdrawal request raises a real support ticket", () => {
  beforeEach(async () => {
    await seedRealClient();
  });

  it("a client requests a manual withdrawal and a support ticket is raised", async () => {
    serveCapture("post", WITHDRAW_ROUTE, "post-accounts-id-affiliate-withdraw");
    const ticketId = recorded<RawWithdrawTicketBody>(
      "post-accounts-id-affiliate-withdraw"
    ).data?.id;

    const seenPosts: { url: string; body: unknown }[] = [];
    server?.events.on("request:start", async ({ request }) => {
      const url = new URL(request.url);
      if (
        request.method === "POST" &&
        url.pathname.endsWith("/affiliate/withdraw")
      ) {
        seenPosts.push({
          url: url.pathname,
          body: await request.clone().json()
        });
      }
    });

    const affiliate = useClientAffiliate().as(ScopeActorTypes.CLIENT);
    await affiliate.useActions().isReady();

    const result = await affiliate
      .useActions()
      .requestWithdrawal({ message: "Please process my withdrawal" });

    // A mutant that fabricates a ticket id with no POST ever reaching the
    // wire stays green under a bare truthy check alone — pin the outbound
    // request and the real recorded ticket id both.
    expect(seenPosts).toHaveLength(1);
    expect(seenPosts[0].url).toContain("/affiliate/withdraw");
    expect(seenPosts[0].body).toEqual({
      message: "Please process my withdrawal"
    });
    expect(result).toBe(ticketId);
    expect(affiliate.useMeta().hasError.value).toBe(false);
  });

  it("A refused withdrawal resolves undefined and sets the error (AC19 Failure surface, declared control)", async () => {
    serveFailure("post", WITHDRAW_ROUTE, 422);

    const seenPosts: { url: string; body: unknown }[] = [];
    server?.events.on("request:start", async ({ request }) => {
      const url = new URL(request.url);
      if (
        request.method === "POST" &&
        url.pathname.endsWith("/affiliate/withdraw")
      ) {
        seenPosts.push({
          url: url.pathname,
          body: await request.clone().json()
        });
      }
    });

    const affiliate = useClientAffiliate().as(ScopeActorTypes.CLIENT);
    await affiliate.useActions().isReady();

    const result = await affiliate
      .useActions()
      .requestWithdrawal({ message: "" });

    expect(seenPosts).toHaveLength(1);
    expect(result).toBeUndefined();
    expect(affiliate.useMeta().hasError.value).toBe(true);
    // The title claims no more than this control can prove: the declared
    // `serveFailure` envelope carries a top-level failure with no per-field
    // shape (`data: null`), so `error` is asserted present, never a named
    // field message this control cannot supply.
    expect(affiliate.useContext().error.value).toBeDefined();
  });
});
