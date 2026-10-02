// -----------------------------------------------------------------------------
/**
 * @fileoverview affiliate.account-conditions — the enrolled/disabled/staged
 * truth table follows the account's real condition (@AC5)
 *
 * ## Job To Be Done
 * Protect `isEnrolled`/`isDisabled`/`isStaged` against the SECOND real
 * enrolled account this unit holds (`otherClient`, review-notes.md R-ENROL),
 * not just the `client` credential's own account — a mutant that hardcodes
 * these three flags to one account's own id would stay green under the
 * `client`-only proof alone.
 *
 * ## The disabled row (R-DATA-4, review-notes.md 2026-10-02) — CLOSED
 * The operator disabled the affiliate account of a staging client. Its self,
 * account and balance are recorded read-only (`affiliate.fixtures.ts`, R-DATA-4)
 * and drive the disabled case through the real module.
 *
 * ## What this does NOT provide (capture gap, named, not silently dropped)
 * No STAGED account is recorded (NO-STAGED-LOGIN, R-DATA-5): the imported
 * client on the other brand origin answers `401 The user credentials were
 * incorrect.` to its login on every origin variant tried, so no staged
 * account read exists to record. `isStaged` is asserted `false` on every
 * recording this file holds, never `true`. The staged scenario stays `@todo`.
 * Evidence: `docs/sdd/FE-3227/evidence/capture-r-data-5-staged-login.md`.
 *
 * ## The not-enrolled row (R-ENROL-2, review-notes.md 2026-10-01) — CLOSED
 * The not-enrolled-404 row is a DIFFERENT cause from the staged gap
 * above: it was capturable under a one-time enrol grant and is now recorded
 * (`affiliate.fixtures.ts`'s own R-ENROL-2 block). The test below drives
 * `useClientAffiliate` through the real not-enrolled capture — not a
 * substitute account-404 override, the REAL recorded not-enrolled body.
 *
 * ## What Breaks If These Fail
 * A truth-table implementation keyed to one specific account id (rather than
 * the condition the wire actually reports) would silently misreport a
 * different client's real enrolled/disabled/staged state.
 */
import { describe, expect, it } from "vitest";
import { AccessRoleTypes } from "@upmind-automation/types";
import { ScopeActorTypes } from "../../scope/scope.types";
import { mapSessionUser, useSessionStore } from "../../session-store";
import { useAffiliateActiveAccount } from "../useAffiliateActiveAccount";
import { useClientAffiliate } from "../useClientAffiliate";
import {
  DISABLED_SELF_CAPTURE,
  ENROL2_SELF_CAPTURE,
  recordedAccountId,
  seedRecordedClient,
  serveCapture
} from "./affiliate.int-helpers";
import { recorded, server } from "./setup.integration";
import type { ISelf } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

type SelfEnvelope = { data: ISelf };

function otherClientSelf(): ISelf {
  return recorded<SelfEnvelope>("self-case-otherclient").data;
}

function otherClientAccountId(): string {
  const id = otherClientSelf().accounts?.[0]?.id;
  if (!id) {
    throw new Error(
      "[affiliate.account-conditions] The recorded otherClient self capture carries no account id."
    );
  }
  return id;
}

async function seedOtherClient(): Promise<void> {
  const self = otherClientSelf();

  await useSessionStore()
    .useActions()
    .add(
      {
        access_token: "affiliate-int-test-otherclient-session-token",
        actor_id: self.actor_id,
        actor_type: AccessRoleTypes.CLIENT,
        expires_in: 3600,
        refresh_expires_in: 36000,
        refresh_token: "affiliate-int-test-otherclient-refresh-token",
        second_factor_required: false,
        token_type: "Bearer",
        twofa_provider: undefined as never
      },
      true,
      mapSessionUser(self)
    );
}

describe("affiliate.account-conditions — a SECOND real enrolled account follows its own condition", () => {
  it("otherClient's enrolled account reads isEnrolled true, isDisabled false, isStaged false, from its own recorded capture", async () => {
    await seedOtherClient();
    serveCapture(
      "get",
      "*/api/accounts/:accountId/affiliate",
      "get-accounts-id-affiliate-case-enrolled-otherclient-with-staged-imports-1"
    );

    const affiliate = useClientAffiliate().as(ScopeActorTypes.CLIENT);
    await affiliate.useActions().isReady();

    // Pin that the resolver genuinely published OTHERCLIENT's own account id
    // (not the `client` credential's account left over from a leaked prior
    // session) — a mutant that hardcodes the truth table to one fixed id
    // would still pass the three flags below alone.
    expect(
      useAffiliateActiveAccount().as(ScopeActorTypes.CLIENT).useContext()
        .activeAccountId.value
    ).toBe(otherClientAccountId());
    expect(affiliate.useMeta().isEnrolled.value).toBe(true);
    expect(affiliate.useMeta().isDisabled.value).toBe(false);
    expect(affiliate.useMeta().isStaged.value).toBe(false);
  });

  it("A client who has never enrolled reads as not enrolled, not disabled and not staged, from its own recorded 404 capture (R-ENROL-2)", async () => {
    await seedRecordedClient(ENROL2_SELF_CAPTURE);
    serveCapture(
      "get",
      "*/api/accounts/:accountId/affiliate",
      "get-accounts-id-affiliate-case-not-enrolled-with-staged-imports-1"
    );

    const seenAccountGets: string[] = [];
    server?.events.on("request:start", ({ request }) => {
      const url = new URL(request.url);
      if (request.method === "GET" && /\/affiliate$/.test(url.pathname))
        seenAccountGets.push(url.pathname);
    });

    const affiliate = useClientAffiliate().as(ScopeActorTypes.CLIENT);
    await affiliate.useActions().isReady();

    expect(
      seenAccountGets.some(path =>
        path.includes(recordedAccountId(ENROL2_SELF_CAPTURE))
      )
    ).toBe(true);
    expect(affiliate.useMeta().isEnrolled.value).toBe(false);
    expect(affiliate.useMeta().isDisabled.value).toBe(false);
    expect(affiliate.useMeta().isStaged.value).toBe(false);
    // design.md §6.1: a 404 on the account read suppresses `hasError`/`error`.
    expect(affiliate.useMeta().hasError.value).toBe(false);
  });

  it("A client whose affiliate account was disabled by staff reads as disabled", async () => {
    await seedRecordedClient(DISABLED_SELF_CAPTURE);
    serveCapture(
      "get",
      "*/api/accounts/:accountId/affiliate",
      "get-accounts-id-affiliate-case-disabled-with-staged-imports-1"
    );
    serveCapture(
      "get",
      "*/api/accounts/:accountId/affiliate/balance",
      "get-accounts-id-affiliate-balance-case-disabled-with-staged-imports-1"
    );

    const seenAccountGets: string[] = [];
    server?.events.on("request:start", ({ request }) => {
      const url = new URL(request.url);
      if (request.method === "GET" && /\/affiliate$/.test(url.pathname))
        seenAccountGets.push(url.pathname);
    });

    const affiliate = useClientAffiliate().as(ScopeActorTypes.CLIENT);
    await affiliate.useActions().isReady();

    expect(
      seenAccountGets.some(path =>
        path.includes(recordedAccountId(DISABLED_SELF_CAPTURE))
      )
    ).toBe(true);
    expect(affiliate.useMeta().isDisabled.value).toBe(true);
    expect(affiliate.useMeta().isEnrolled.value).toBe(true);
    expect(affiliate.useMeta().isStaged.value).toBe(false);
    expect(affiliate.useMeta().hasError.value).toBe(false);
  });
});
