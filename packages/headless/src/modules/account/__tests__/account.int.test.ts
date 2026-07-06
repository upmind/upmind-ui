/**
 * @fileoverview Account integration — real standing-arc machine + MSW replay
 *
 * ## Job To Be Done
 * Drive the REAL useAccount machine over seeded session identities (D2)
 * against recorded /clients fixtures: standing routing (guest-first,
 * brand-gated verification), code-verify 204 handling, resend 409, and the
 * guest-email no-op — asserting request payloads and absence, not state names.
 *
 * ## What Breaks If These Fail
 * Guests get asked to verify emails they can't; brands that don't enforce
 * verification nag verified-enough clients; a 204 No Content crashes the
 * verify path; resend 409 is retried forever; guest-email autosave spams PUTs.
 */

import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { getFixture, getFixtureBody } from "@upmind-automation/test-fixtures";
import { clearSessionCookies } from "../../../__tests__/int-test-helpers";
import {
  useSessionStore,
  useActiveSession,
  mapSessionUser
} from "../../session-store";
import { useAccount } from "../useAccount";
import { server } from "./setup.integration";
import { cloneDeep } from "lodash-es";
import type { ISelf, IToken } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

// D3 (ADR-021 "mock settings not data"; acct-gotchas §6): brand
// enforce-email-verification stub. Declared here — NOT in setup.integration.ts —
// because the integration project registers no `setupFiles`, so a `vi.mock` in
// that plain imported helper never hoists and silently no-ops. A mutable ref
// tests flip per case (never inlined mid-test).
const brandStub = vi.hoisted(() => ({
  enforceEmailVerification: { value: true }
}));

vi.mock("../../brand", async importOriginal => {
  const actual = await importOriginal<{
    useBrand: () => Record<string, unknown>;
  }>();
  return {
    ...actual,
    useBrand: () => ({ ...actual.useBrand(), ...brandStub })
  };
});

// -----------------------------------------------------------------------------

const recordingsDir = join(import.meta.dirname, "fixtures");

// D2: account's own fixtures dir has no oauth capture (Phase 0 only added
// GET /self) — the client token needed to seed a session is cross-module
// input material from session-store's own Phase-0 capture (same actor_id,
// "mock-uuid-1", as account's own get-self fixture). Never asserted on here;
// only used to put a client-scoped session in place. See test-design.md D2.
const sessionStoreRecordingsDir = join(
  import.meta.dirname,
  "../../session-store/__tests__/fixtures"
);

type SelfResponse = { data: ISelf };

/**
 * D2 seeding seam (re-audit round 2 §ACCOUNT): a single public `add()` call
 * seeds the session AND the D2-toggled standing user in one step — no
 * `/self` round-trip, no storage poke. The D2 overrides (`is_guest` /
 * `verified` / `default_email.verified`) are applied to the `/self` FIXTURE
 * body before mapping, per the re-audit's exact instruction.
 */
async function seedStanding(overrides: {
  isGuest: boolean;
  verified: boolean;
  emailVerified: boolean;
}): Promise<void> {
  const clientToken = getFixtureBody<IToken>("post-oauth-access-token-client", {
    recordingsDir: sessionStoreRecordingsDir
  });

  const selfResponse = getFixtureBody<SelfResponse>("get-self", {
    recordingsDir
  });
  const selfBody = cloneDeep(selfResponse.data);
  selfBody.actor.is_guest = overrides.isGuest; // D2
  selfBody.actor.verified = overrides.verified; // D2
  selfBody.actor.default_email.verified = overrides.emailVerified; // D2

  const guestFx = getFixture("post-oauth-access-token-guest", {
    recordingsDir: sessionStoreRecordingsDir
  });
  server?.use(
    http.post("*/oauth/access_token", () =>
      HttpResponse.json(guestFx.response.body as object, {
        status: guestFx.response.status
      })
    )
  );
  // `add()` needs a settled `initStore()` first (verified empirically against
  // session-store's own int suite: the identical `add()` call is a no-op —
  // `allSessions` stays empty — until the store has booted). The guest-mint
  // override above unblocks `initStore()` in this realm, since account's own
  // fixtures dir has no oauth capture (see file header).
  await useSessionStore().initStore();
  await useSessionStore()
    .useActions()
    .add(clientToken, true, mapSessionUser(selfBody));
  // Let the seeded session settle to available+authenticated BEFORE any
  // account machine is constructed. The machine spawns an authSubscription
  // whose initial AUTHENTICATED/SESSION emit (deferred to a microtask) resets
  // the arc to `subscribing`; if that lands mid-operation it aborts an
  // in-flight verify/resend. In the real app the store is booted long before
  // any account interaction, so the emit is harmless — this mirrors that.
  await vi.waitFor(() => {
    const meta = useActiveSession().useMeta();
    expect(meta.isAvailable.value).toBe(true);
    expect(meta.isAuthenticated.value).toBe(true);
  });
}

// -----------------------------------------------------------------------------

// TEST-DEFECT, seam corrected (re-audit round 2 §ACCOUNT, F5): the round-1
// "D2 seeding seam is dead" finding traced to seeding via
// `persistTokenToStorage` + `updateUser` — `persistTokenToStorage` only
// writes the single cookie and does NOT populate the multi-session store
// (THE MODEL). `seedStanding` now seeds via the store's own public `add()`
// (after `initStore()`), exactly the re-audit's prescribed seam. Un-skipped
// accordingly.
//
// STILL-BROKEN-TEST FLAG (found while verifying, not by the re-audit):
// empirically, `add()` after `initStore()` is a no-op in THIS harness —
// `allSessions` stays `{}` — even though the identical call sequence works
// in session-store's own int suite. Root cause not isolated within
// ADR-021's read constraints (cannot inspect `useAccount`/session-store
// internals for an earlier conflicting `initStore()` call at import time)
// and the review budget. AC-I1–I8 are therefore expected to stay red for a
// harness reason distinct from the seam itself — reported for the owner to
// investigate, not weakened to pass.
describe("account integration (fixture replay)", () => {
  beforeEach(() => {
    clearSessionCookies();
    sessionStorage.clear();
    useAccount().as("client").useActions().destroy();
    brandStub.enforceEmailVerification.value = true;
  });

  it("AC-I1 a guest is routed to upgrade, never to verify — even with an unverified email", async () => {
    // acct-gotchas §5 🧪; acct-foundation §State model (guest evaluated first)
    brandStub.enforceEmailVerification.value = true;
    await seedStanding({
      isGuest: true,
      verified: false,
      emailVerified: false
    });

    const meta = useAccount().as("client").useMeta();

    expect(meta.isGuest.value).toBe(true);
    expect(meta.showVerifyEmailForm.value).toBe(false);
  });

  it("AC-I2 brand not enforcing verification settles an unverified client", async () => {
    // acct-gotchas §6 🧪 (two-brand contrast)
    brandStub.enforceEmailVerification.value = false; // D3
    await seedStanding({
      isGuest: false,
      verified: false,
      emailVerified: false
    });

    const meta = useAccount().as("client").useMeta();

    expect(meta.showVerifyEmailForm.value).toBe(false);
    expect(meta.canShowForms.value).toBe(false);
  });

  it("AC-I3 brand enforcing verification routes the same client to the verify form", async () => {
    // acct-gotchas §6 🧪
    brandStub.enforceEmailVerification.value = true; // D3
    await seedStanding({
      isGuest: false,
      verified: false,
      emailVerified: false
    });

    const meta = useAccount().as("client").useMeta();

    expect(meta.showVerifyEmailForm.value).toBe(true);
  });

  it("AC-I4 verify 204 resolves true immediately — no profile-refetch wait, no body-parse crash", async () => {
    // acct-gotchas §1 🧪 (captured case ONLY — ruling a3); acct-gotchas §8 🧪;
    // acct-usage §verify 🧪
    brandStub.enforceEmailVerification.value = true;
    await seedStanding({
      isGuest: false,
      verified: false,
      emailVerified: false
    });
    const account = useAccount().as("client");
    // Drain the authSubscription's initial AUTHENTICATED/SESSION reset before
    // acting, so it can't abort the in-flight verify (see seedStanding).
    await vi.waitFor(() =>
      expect(account.useMeta().showVerifyEmailForm.value).toBe(true)
    );

    const fx = getFixture("post-clients-verification-code-verify", {
      recordingsDir
    });
    let capturedBody: unknown;
    const getRequests: string[] = [];
    server?.use(
      http.post("*/clients/verification_code/verify", async ({ request }) => {
        capturedBody = await request.json();
        return new HttpResponse(null, { status: fx.response.status });
      })
    );
    const spy = ({ request }: { request: Request }): void => {
      if (request.method === "GET") getRequests.push(request.url);
    };
    server?.events.on("request:start", spy);

    const result = await account.useActions().verify({ code: "000000" });

    server?.events.removeListener("request:start", spy);

    expect(result).toBe(true);
    expect(account.useMeta().showVerifyEmailForm.value).toBe(false);
    expect(getRequests).toHaveLength(0);
    expect(capturedBody).toEqual({ code: "000000" });
  });

  it("AC-I5 empty verify code fires no request", async () => {
    // acct-usage §verify 🧪 ("empty/missing code resolves false with no request fired")
    brandStub.enforceEmailVerification.value = true;
    await seedStanding({
      isGuest: false,
      verified: false,
      emailVerified: false
    });
    const account = useAccount().as("client");

    const requests: string[] = [];
    const spy = ({ request }: { request: Request }): void => {
      requests.push(request.url);
    };
    server?.events.on("request:start", spy);

    const result = await account.useActions().verify({ code: "" });

    server?.events.removeListener("request:start", spy);

    expect(result).toBe(false);
    expect(requests.some(url => url.includes("verification_code/verify"))).toBe(
      false
    );
    expect(account.useContext().errors).toBeDefined();
  });

  it("AC-I6 resend against a verified client → 409 → terminal failure flags", async () => {
    // acct-gotchas §2 🧪; acct-foundation §Failure modes (409 "nothing to resend")
    brandStub.enforceEmailVerification.value = true;
    await seedStanding({
      isGuest: false,
      verified: false,
      emailVerified: false
    });
    const account = useAccount().as("client");
    // Drain the authSubscription's initial AUTHENTICATED/SESSION reset before
    // acting, so it can't reset the resend region mid-flight (see seedStanding).
    await vi.waitFor(() =>
      expect(account.useMeta().showVerifyEmailForm.value).toBe(true)
    );

    const fx = getFixture("post-clients-resend-verification", {
      recordingsDir
    });
    let resendCalls = 0;
    server?.use(
      http.post("*/clients/resend_verification", () => {
        resendCalls += 1;
        return HttpResponse.json(fx.response.body as object, {
          status: fx.response.status
        });
      })
    );

    account.useActions().resend();

    await vi.waitFor(() => {
      expect(account.useMeta().resendFailed.value).toBe(true);
    });

    expect(account.useMeta().hasErrors.value).toBe(true);
    expect(resendCalls).toBe(1);
  });

  it("AC-I7 the guest upgrade form loads the recorded order-form custom fields", async () => {
    // acct-foundation §GET /clients_fields (fixture); acct-usage §Context 🧪
    brandStub.enforceEmailVerification.value = true;
    await seedStanding({
      isGuest: true,
      verified: false,
      emailVerified: false
    });
    const context = useAccount().as("client").useContext();

    // The register schema is set synchronously on entry with EMPTY custom
    // fields; profile_picture only appears once getCustomFields resolves. Wait
    // for the loaded field, not merely for schema to be defined.
    await vi.waitFor(() => {
      const activeForm = JSON.stringify({
        schema: context.schema.value,
        uischema: context.uischema.value
      });
      expect(activeForm).toContain("profile_picture");
    });
  });

  it("AC-I8 updateGuestEmail with an unchanged value is a silent no-op", async () => {
    // acct-usage §updateGuestEmail 🧪; acct-gotchas §7 🧪
    brandStub.enforceEmailVerification.value = true;
    await seedStanding({
      isGuest: true,
      verified: false,
      emailVerified: false
    });

    const selfResponse = getFixtureBody<SelfResponse>("get-self", {
      recordingsDir
    });
    const seededEmail = selfResponse.data.actor.username;
    const account = useAccount().as("client");

    const requestMethods: string[] = [];
    const spy = ({ request }: { request: Request }): void => {
      requestMethods.push(request.method);
    };
    server?.events.on("request:start", spy);

    const result = await account
      .useActions()
      .updateGuestEmail({ email: seededEmail });

    server?.events.removeListener("request:start", spy);

    expect(result).toBe(true);
    expect(requestMethods).not.toContain("PUT");
  });
});
