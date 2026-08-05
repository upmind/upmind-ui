// -----------------------------------------------------------------------------
/**
 * @fileoverview client-email — the never-authenticated guard (AC-10)
 *
 * ## Job To Be Done
 * Prove AC-10 under its literal precondition: a session that NEVER
 * authenticates. No test in this file seeds a client session, and vitest
 * isolates each test file, so the store here only ever reaches the guest
 * floor. Under that condition: zero requests against any client's email
 * resource, every forced read or mutation rejected as not-authenticated, the
 * collection never reporting itself ready, and — AC-3 — the collection
 * reporting itself UNAVAILABLE while still reporting itself loading, so a
 * consumer tells "not mine to read" from "still settling" without ever
 * inspecting the session.
 *
 * The auth-guard `*.must-fail.patch` removes the guard; the "no request" and
 * "rejects" assertions here are what must then fire.
 *
 * ## What Breaks If These Fail
 * An unauthenticated caller reaches a client's email collection at all — the
 * one thing legacy's `<guard :if-client>` never allowed.
 */

import { describe, expect, it } from "vitest";
import { useClientEmailManager, useClientEmails } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useSessionStore } from "../../session-store";
import {
  installBackgroundStubs,
  observeEmailRequests,
  recorded
} from "./client-email.int-helpers";
import { NotAuthenticatedError } from "../../../utils";

// -----------------------------------------------------------------------------

/** Boots the store to the guest floor — no client session is ever added. */
async function bootUnauthenticated(): Promise<void> {
  installBackgroundStubs();
  await useSessionStore().initStore();
}

/**
 * The value an action SETTLED on: its rejection, a `{ resolved }` wrapper, or
 * the `never-settled` sentinel. Raced rather than awaited outright for the same
 * reason the readiness read-back below is — with the guard removed, `ensure`
 * blocks on a list read that never resolves, so a bare `rejects` assertion
 * reports a 30s file timeout instead of naming what went wrong.
 */
async function settlement(action: Promise<unknown>): Promise<unknown> {
  return Promise.race([
    action.then(
      resolved => ({ resolved }),
      rejection => rejection
    ),
    new Promise(resolve => setTimeout(() => resolve("never-settled"), 3000))
  ]);
}

// -----------------------------------------------------------------------------

describe("client-email with no authenticated client session (AC-10)", () => {
  it("AC-10 makes no request against any client's email resource", async () => {
    await bootUnauthenticated();
    const observed = observeEmailRequests();

    useClientEmails().as(ScopeActorTypes.SELF);
    useClientEmailManager()
      .as(ScopeActorTypes.SELF)
      .for("email", recorded.one().data.id);
    // Give an (incorrectly) enabled query time to fire before asserting absence.
    await new Promise(resolve => setTimeout(resolve, 400));
    observed.stop();

    expect(observed.all().map(request => request.url)).toEqual([]);
  });

  it("AC-10 rejects a forced read as not-authenticated", async () => {
    await bootUnauthenticated();

    const emails = useClientEmails().as(ScopeActorTypes.SELF);

    await expect(emails.useActions().refresh()).rejects.toBeInstanceOf(
      NotAuthenticatedError
    );
  });

  it("AC-10 rejects every mutation as not-authenticated", async () => {
    await bootUnauthenticated();
    const target = recorded.one().data;

    const emails = useClientEmails().as(ScopeActorTypes.SELF);

    await expect(
      settlement(emails.useActions().ensure({ email: target.email })),
      "ensure"
    ).resolves.toBeInstanceOf(NotAuthenticatedError);
    await expect(
      settlement(emails.useActions().remove(target.id)),
      "remove"
    ).resolves.toBeInstanceOf(NotAuthenticatedError);
    await expect(
      settlement(emails.useActions().setDefault(target.id)),
      "setDefault"
    ).resolves.toBeInstanceOf(NotAuthenticatedError);
    await expect(
      settlement(emails.useActions().verify(target.id)),
      "verify"
    ).resolves.toBeInstanceOf(NotAuthenticatedError);
  });

  it("AC-10 never reports the collection ready while the session never authenticates", async () => {
    await bootUnauthenticated();

    const emails = useClientEmails().as(ScopeActorTypes.SELF);

    // Raced rather than awaited outright: the read-back is that readiness
    // SETTLES false, so a promise that never settles must fail fast and say
    // so, not burn the file's timeout.
    const settled = await Promise.race([
      emails.useActions().isReady(),
      new Promise(resolve => setTimeout(() => resolve("never-settled"), 3000))
    ]);

    expect(settled).toBe(false);
  });

  it("AC-3 reports the collection unavailable while the session never authenticates, and still reports it loading", async () => {
    await bootUnauthenticated();

    const meta = useClientEmails().as(ScopeActorTypes.SELF).useMeta();

    expect(meta.isAvailable.value).toBe(false);
    expect(meta.isLoading.value).toBe(true);

    // A first-tick false is not the read-back: the pair must still separate
    // "not mine to read" from "still settling" once the store has settled.
    await new Promise(resolve => setTimeout(resolve, 400));

    expect(meta.isAvailable.value).toBe(false);
    expect(meta.isLoading.value).toBe(true);
  });
});
