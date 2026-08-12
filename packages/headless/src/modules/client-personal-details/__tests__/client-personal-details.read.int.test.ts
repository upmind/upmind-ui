// -----------------------------------------------------------------------------
/**
 * @fileoverview client-personal-details read half — the query, its identity
 * seam, and cold boot (AC-30, AC-31, AC-41)
 *
 * ## Job To Be Done
 * Drive the REAL `usePersonalDetails()` THROUGH THE BARREL against
 * MSW-replayed staging recordings and prove: the profile read is a real
 * query carrying actual values, never the placeholder string `"undefined"`
 * that the old session projection produced (AC-30); the read URL and the
 * subsequent write URL resolve through the SAME identity seam, addressing
 * the SAME profile whether that id is the session's own or an explicitly
 * named one (AC-30's retarget half — the A7 read-back: request URL AND auth
 * identity transport, never the response payload alone); a failed read
 * settles with an error rather than hanging (AC-31); and a cold boot that
 * resolves its client id late still lands exactly one addressed request
 * (AC-41).
 *
 * The retarget id is a labelled CONSTRUCTED id — this brand has one real
 * staging client, so a second real profile is not obtainable. The read-back
 * this AC needs is about the REQUEST this module issues (URL + identity
 * transport), not about a second account's real data, so a constructed
 * target id with its own installed handler proves exactly the property named
 * — the same technique the AC-2 negative-control-gap analysis in
 * `parity.yaml` identifies as unavailable at single-cell scope for MODULE A's
 * `custom_field_values` context, but which the `resolveClientId` seam in
 * THIS module's design (`design.md` §3.4) makes observable here because the
 * profile id is taken from the caller's `.for('profile', id)` argument, not
 * hardwired.
 *
 * ## What Breaks If These Fail
 * The FE-2824 shape: a read and a write that can silently address different
 * clients, or a read that never actually reaches the wire (the JTBD's first
 * verb, absent per `requirements.md` §7.1).
 */

import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
// Primed by import order (not mocked): the real `session-store` must resolve
// BEFORE this module's own barrel is imported, or the transitive walk
// `../scope` -> `session-store` -> `query` -> `basket` -> `client-company` ->
// `client-email` re-enters `../scope` mid-evaluation and
// `createScopedComposable` is undefined at the crash site
// (`client-email/useClientEmails.ts:80`) — the load-order landmine this
// module's own harness note documents. `client-email.int-helpers.ts` is the
// precedent: import the helpers (which import `session-store`) before the
// module under test. Sorting this block alphabetically regresses the whole
// suite (module A's prover lost a cycle to exactly this).
// eslint-disable-next-line import/order
import {
  assertClientIdentityTransport,
  observeClientRequests,
  recorded,
  resolveClientIdOnActiveSession,
  seedAuthenticatedSessionWithoutClientId,
  seedClientSession
} from "./client-personal-details.int-helpers";
import { usePersonalDetails } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import { server } from "./setup.integration";
import type { IClient } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

/** A constructed id, deliberately distinct from the session's real client id. */
const OTHER_CLIENT_ID = "11111111-2222-3333-4444-555555555555";

/** The recorded profile envelope, re-addressed to the constructed other id. */
function otherClientEnvelope(): {
  status: string;
  data: IClient;
  total: number;
  error: null;
  messages: unknown[];
  meta: null;
} {
  const recordedProfile = recorded.profile();
  return {
    ...recordedProfile,
    data: { ...recordedProfile.data, id: OTHER_CLIENT_ID }
  };
}

// -----------------------------------------------------------------------------

describe("usePersonalDetails — reading my actual values (AC-30)", () => {
  it('AC-30 shows my real custom field values, never the placeholder word "undefined"', async () => {
    const { clientId } = await seedClientSession();
    server?.use(
      http.get(`*/clients/${clientId}`, () =>
        HttpResponse.json(recorded.profile(), { status: 200 })
      )
    );

    const details = usePersonalDetails().as(ScopeActorTypes.SELF);
    await details.useActions().isReady();

    expect(details.useContext().data.value).toBeDefined();
    for (const field of details.useContext().customFields.value) {
      expect(String((field as { value: unknown }).value)).not.toBe("undefined");
    }
  });
});

describe("usePersonalDetails — the identity seam (AC-30 retarget)", () => {
  it("AC-30 reads clients/{id} for the session's own client when no context is given", async () => {
    const { clientId, accessToken } = await seedClientSession();
    server?.use(
      http.get(`*/clients/${clientId}`, () =>
        HttpResponse.json(recorded.profile(), { status: 200 })
      )
    );
    const observed = observeClientRequests();

    const details = usePersonalDetails().as(ScopeActorTypes.SELF);
    await details.useActions().isReady();

    observed.stop();
    const read = observed.all().find(request => request.method === "GET");
    expect(read).toBeDefined();
    assertClientIdentityTransport(read!, clientId, accessToken);
  });

  it("AC-30 reads AND writes clients/{id} for an EXPLICITLY NAMED profile — the read and the write address the same client, and it is not the session's own", async () => {
    const { clientId: sessionClientId, accessToken } =
      await seedClientSession();
    // Not manufactured: `otherClientEnvelope()` (above) spreads the RECORDED
    // `recorded.profile()` envelope and overrides only `data.id`. This
    // staging brand has exactly one real client, so a second real account
    // to record this fixture AGAINST does not exist — the id is the only
    // constructed part in both handlers below; everything else is the
    // recorded body.
    server?.use(
      http.get(`*/clients/${OTHER_CLIENT_ID}`, () =>
        // eslint-disable-next-line scope-based/no-hand-rolled-int-fixture
        HttpResponse.json(otherClientEnvelope(), { status: 200 })
      ),
      http.put(`*/clients/${OTHER_CLIENT_ID}`, () =>
        // eslint-disable-next-line scope-based/no-hand-rolled-int-fixture
        HttpResponse.json(otherClientEnvelope(), { status: 200 })
      )
    );
    const observed = observeClientRequests();

    const details = usePersonalDetails()
      .as(ScopeActorTypes.SELF)
      .for("profile", OTHER_CLIENT_ID);
    await details.useActions().isReady();
    await details.useActions().refresh();

    observed.stop();
    const requests = observed.all();

    expect(OTHER_CLIENT_ID).not.toBe(sessionClientId);
    expect(
      requests.some(request =>
        request.url.includes(`/clients/${OTHER_CLIENT_ID}`)
      )
    ).toBe(true);
    expect(
      requests.some(request =>
        request.url.includes(`/clients/${sessionClientId}`)
      )
    ).toBe(false);

    for (const request of requests) {
      assertClientIdentityTransport(request, OTHER_CLIENT_ID, accessToken);
    }
  });
});

describe("usePersonalDetails — settling on error (AC-31)", () => {
  it("AC-31 reports hasError and a populated error on a 500, and isReady() resolves false without hanging", async () => {
    const { clientId } = await seedClientSession();
    server?.use(
      http.get(`*/clients/${clientId}`, () =>
        HttpResponse.json({ status: "error", data: null }, { status: 500 })
      )
    );

    const details = usePersonalDetails().as(ScopeActorTypes.SELF);
    // TanStack Query's default retry/backoff on a 500 can itself take several
    // seconds before the query settles into its error state — the race
    // timeout is generous so a genuinely-hanging isReady() is still caught,
    // without mistaking normal retry backoff for a hang.
    const settled = await Promise.race([
      details.useActions().isReady(),
      new Promise(resolve => setTimeout(() => resolve("never-settled"), 20000))
    ]);

    expect(settled).toBe(false);
    expect(details.useMeta().hasError.value).toBe(true);
    expect(details.useContext().error.value).toBeDefined();
  }, 25000);
});

describe("usePersonalDetails — cold boot resolves the target late (AC-41)", () => {
  it("AC-41 issues exactly one read, against the resolved id, once the session resolves late", async () => {
    // Constructs the composable while AUTHENTICATED but with no client id
    // yet resolved, then lands the id on the SAME active session — never
    // resetting the scope registry — so this exact instance has to survive
    // the transition for the transition to be observable at all
    // (client-email.int-helpers.ts's own resolveClientIdOnActiveSession is
    // the precedent seedClientSession's full reset would defeat here).
    await seedAuthenticatedSessionWithoutClientId();

    const observed = observeClientRequests();
    const details = usePersonalDetails().as(ScopeActorTypes.SELF);

    await new Promise(resolve => setTimeout(resolve, 100));
    const { clientId } = await resolveClientIdOnActiveSession();
    server?.use(
      http.get(`*/clients/${clientId}`, () =>
        HttpResponse.json(recorded.profile(), { status: 200 })
      )
    );

    await details.useActions().isReady();
    observed.stop();

    const reads = observed.all().filter(request => request.method === "GET");
    expect(reads).toHaveLength(1);
    expect(reads[0].url).toContain(`/clients/${clientId}`);
    for (const request of observed.all()) {
      expect(request.url).not.toContain("undefined");
    }
    expect(details.useContext().data.value).toBeDefined();
  });

  it("AC-41 issues exactly one read when constructed AFTER the session has already resolved", async () => {
    const { clientId } = await seedClientSession();
    server?.use(
      http.get(`*/clients/${clientId}`, () =>
        HttpResponse.json(recorded.profile(), { status: 200 })
      )
    );
    const observed = observeClientRequests();

    const details = usePersonalDetails().as(ScopeActorTypes.SELF);
    await details.useActions().isReady();

    observed.stop();
    const reads = observed.all().filter(request => request.method === "GET");
    expect(reads).toHaveLength(1);
  });
});
