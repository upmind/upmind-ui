// -----------------------------------------------------------------------------
/**
 * @fileoverview client-email-history — the whole-module auth guard (AC-5,
 * AC-16, AC-18)
 *
 * ## Job To Be Done
 * Prove AC-18 under its literal precondition: no authenticated client
 * session, on EITHER composable. Zero requests fire, and a forced read
 * (`refresh()`) rejects `NotAuthenticatedError` rather than issuing one.
 * AC-5/AC-16 are the same predicate read as state: `isAvailable` false while
 * `isLoading` still true, then unavailable-and-settled once the session
 * settles with no addressable client. AC-16's own closing clause — "once I am
 * signed in, it tells me the email is available and reads it" — is proven on
 * an ALREADY-CONSTRUCTED single-read instance: `signInClientSessionMidLife`
 * signs the store in WITHOUT evicting the scope registry (never
 * `seedClientSession`, which resets it), so the held reference's own
 * `effectScope` and TanStack watcher survive the transition. AC-5 makes no
 * equivalent claim for the collection — its Gherkin only requires the static
 * "before I am signed in" read (above) and the reverse, session-dies
 * transition — so no collection counterpart is added here.
 *
 * `client-email-history.auth-guard.must-fail.patch` removes the `guard` from
 * BOTH `loadList` and `loadOne`; per its own "Expected RED" comment, `enabled`
 * alone still stops the query auto-firing, so the "no request" assertions
 * stay green — it is the two "forced read rejects" assertions here that must
 * flip RED when the patch is applied.
 */

import { describe, expect, it, vi } from "vitest";
import { useClientReceivedEmail, useClientReceivedEmails } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  bootUnauthenticated,
  installEmailHistoryHandlers,
  logoutClientSession,
  observeEmailHistoryRequests,
  recorded,
  signInClientSessionMidLife
} from "./client-email-history.int-helpers";
import { NotAuthenticatedError } from "../../../utils";
import "./setup.integration";

// -----------------------------------------------------------------------------

describe("client-email-history with no authenticated client session (AC-18)", () => {
  it("AC-18 makes no request against either surface", async () => {
    await bootUnauthenticated();
    installEmailHistoryHandlers();
    const observed = observeEmailHistoryRequests();

    useClientReceivedEmails().as(ScopeActorTypes.CLIENT);
    useClientReceivedEmail()
      .as(ScopeActorTypes.CLIENT)
      .withId(recorded.one().data.id);
    // Give an (incorrectly) enabled query time to fire before asserting absence.
    await new Promise(resolve => setTimeout(resolve, 400));
    observed.stop();

    expect(observed.all().map(request => request.url)).toEqual([]);
  });

  it("AC-18 rejects the collection's forced read as not-authenticated, and issues no request", async () => {
    await bootUnauthenticated();
    installEmailHistoryHandlers();
    const observed = observeEmailHistoryRequests();

    const emails = useClientReceivedEmails().as(ScopeActorTypes.CLIENT);
    await expect(emails.useActions().refresh()).rejects.toBeInstanceOf(
      NotAuthenticatedError
    );
    observed.stop();

    expect(observed.all()).toEqual([]);
  });

  it("AC-18 rejects the single read's forced read as not-authenticated, and issues no request", async () => {
    await bootUnauthenticated();
    const handlers = installEmailHistoryHandlers();
    handlers.setOneBody(recorded.one());
    const observed = observeEmailHistoryRequests();

    const single = useClientReceivedEmail()
      .as(ScopeActorTypes.CLIENT)
      .withId(recorded.one().data.id);
    await expect(single.useActions().refresh()).rejects.toBeInstanceOf(
      NotAuthenticatedError
    );
    observed.stop();

    expect(observed.all()).toEqual([]);
  });
});

describe("client-email-history collection — addressability while unauthenticated (AC-5)", () => {
  it("AC-5 reports isAvailable false while still reporting isLoading true", async () => {
    await bootUnauthenticated();
    installEmailHistoryHandlers();

    const emails = useClientReceivedEmails().as(ScopeActorTypes.CLIENT);

    expect(emails.useMeta().isAvailable.value).toBe(false);
    expect(emails.useMeta().isLoading.value).toBe(true);

    await new Promise(resolve => setTimeout(resolve, 400));

    expect(emails.useMeta().isAvailable.value).toBe(false);
    expect(emails.useMeta().isLoading.value).toBe(true);
  });

  it("AC-4 isReady() settles false rather than hanging, with no addressable client", async () => {
    await bootUnauthenticated();
    installEmailHistoryHandlers();

    const emails = useClientReceivedEmails().as(ScopeActorTypes.CLIENT);

    const settled = await Promise.race([
      emails.useActions().isReady(),
      new Promise(resolve => setTimeout(() => resolve("never-settled"), 3000))
    ]);

    expect(settled).toBe(false);
  });
});

describe("client-email-history single read — addressability while unauthenticated (AC-16)", () => {
  it("AC-16 reports isAvailable false and issues no request while signed out", async () => {
    await bootUnauthenticated();
    const handlers = installEmailHistoryHandlers();
    handlers.setOneBody(recorded.one());
    const observed = observeEmailHistoryRequests();

    const single = useClientReceivedEmail()
      .as(ScopeActorTypes.CLIENT)
      .withId(recorded.one().data.id);

    expect(single.useMeta().isAvailable.value).toBe(false);
    await new Promise(resolve => setTimeout(resolve, 400));
    observed.stop();

    expect(observed.all()).toEqual([]);
  });

  it("AC-16 an already-constructed single-read instance becomes available and fetches once the session signs in mid-life", async () => {
    await bootUnauthenticated();
    const handlers = installEmailHistoryHandlers();
    handlers.setOneBody(recorded.one());
    const observed = observeEmailHistoryRequests();

    const single = useClientReceivedEmail()
      .as(ScopeActorTypes.CLIENT)
      .withId(recorded.one().data.id);

    expect(single.useMeta().isAvailable.value).toBe(false);
    await new Promise(resolve => setTimeout(resolve, 200));
    expect(observed.all()).toEqual([]);

    try {
      await signInClientSessionMidLife();

      await vi.waitFor(() => {
        expect(single.useMeta().isAvailable.value).toBe(true);
      });
      await vi.waitFor(
        () => {
          expect(single.useMeta().isLoading.value).toBe(false);
        },
        { timeout: 3000 }
      );
      observed.stop();

      expect(observed.all()).toHaveLength(1);
    } finally {
      // This is the only test in the file that signs a session IN — undo it so
      // later tests in this describe block still boot from the guest floor
      // rather than inheriting a live client session.
      await logoutClientSession();
    }
  });

  it("AC-15 isReady() settles false rather than hanging, with no addressable client", async () => {
    await bootUnauthenticated();
    const handlers = installEmailHistoryHandlers();
    handlers.setOneBody(recorded.one());

    const single = useClientReceivedEmail()
      .as(ScopeActorTypes.CLIENT)
      .withId(recorded.one().data.id);

    const settled = await Promise.race([
      single.useActions().isReady(),
      new Promise(resolve => setTimeout(() => resolve("never-settled"), 3000))
    ]);

    expect(settled).toBe(false);
  });
});
