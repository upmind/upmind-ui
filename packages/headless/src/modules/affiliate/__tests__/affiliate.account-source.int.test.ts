// -----------------------------------------------------------------------------
/**
 * @fileoverview affiliate.account-source — the resolver addresses the
 * client's own account from the session (R-NO-SWITCH surviving rule)
 *
 * ## Job To Be Done
 * Protect the one account-resolution rule R-NO-SWITCH keeps (review-notes.md,
 * 2026-09-30): "the module addresses the client's own account from the
 * session: the `/self` `account_id` when present, else the client's only
 * account." Switching, storage and cross-tab sync are removed entirely
 * (affiliate.account-selection.int.test.ts's own header); this file is the
 * dedicated proof for what remains.
 *
 * ## What Breaks If These Fail
 * A client would see data addressed to the wrong account, or no account at
 * all, on the one path the module still resolves automatically.
 *
 * ## Named gap — cannot discriminate the two candidate mechanisms (honest, not guessed)
 * This unit's ONE real staging account has `self.account_id` EQUAL to
 * `self.accounts[0].id` (`affiliate.int-helpers.ts`'s own recorded capture —
 * `get-self.json`: both read `d0367942-4d0e-7109-92eb-3153698d582e`). So a
 * resolver that reads `self.account_id` and a resolver that hardcodes
 * `accounts[0]` publish the IDENTICAL id on this data — this spec cannot
 * tell them apart, and does not claim to. The prover's Read-block (§3.9)
 * bars opening `useAffiliateActiveAccount.internals.ts`/`.actions.ts` to
 * confirm which wire path the resolver actually depends on (a raw
 * `GET /api/self` read, `session-store`'s own mapped `activeUser` — whose
 * public `SessionUser` type carries no singular `account_id` field at all,
 * per `session-store.types.ts` — or something else), so building a
 * synthetic override that forces `self.account_id` to diverge from
 * `accounts[0].id` risks asserting on a code path this seat cannot confirm
 * the resolver reads at all. Discriminating the two branches needs either a
 * second real staging account (NO-TWO-ACCOUNT, same named blocker as the
 * rest of this module) or a developer-seat confirmation of the exact read
 * this rule depends on. Named here and in `affiliate.feature`
 * (`@account-source @todo`), not silently claimed proven.
 *
 * ## Named gap — NO-SELF-WITHOUT-ACCOUNT-ID (the fallback half)
 * The "else the client's only account" half has no proof. The only way to
 * reach it was a recorded `self` with `account_id` removed by a call-site
 * override, which flips a value inside a recording (ADR-035). A read-only
 * recording of a real `self` that carries no `account_id` is not available:
 * all five staging client credentials of this repo that log in on this brand
 * return one (evidence/capture-self-without-account-id-probe.md). The case is
 * removed, and the feature keeps one `@todo` scenario for it.
 *
 * Stated omissions (ADR-021, design.md §8.2): this spec sends no write and
 * asserts no failure branch of its own.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useAffiliateActiveAccount } from "../useAffiliateActiveAccount";
import {
  recordedAccountId,
  recordedSelf,
  seedRealClient
} from "./affiliate.int-helpers";

// -----------------------------------------------------------------------------

describe("affiliate.account-source — the resolver addresses the client's own account from the session", () => {
  beforeEach(async () => {
    await seedRealClient();
  });

  it("the resolver addresses the client's own account from the session", async () => {
    const resolver = useAffiliateActiveAccount().as(ScopeActorTypes.CLIENT);
    await resolver.useActions().isReady();

    const self = recordedSelf() as unknown as { account_id?: string };

    // Both candidate sources agree on this real, single-account capture —
    // the coincidence this file's header names. Asserting against BOTH,
    // rather than one hard-coded literal, keeps the test honest about what
    // it can and cannot discriminate.
    expect(self.account_id).toBe(recordedAccountId());
    expect(resolver.useContext().activeAccountId.value).toBe(
      recordedAccountId()
    );
  });
});
