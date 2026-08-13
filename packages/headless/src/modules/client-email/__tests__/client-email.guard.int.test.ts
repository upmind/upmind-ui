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
 * Both scope shapes are driven: `.as(self)` with no context, whose target id
 * comes from the session and so is absent on the guest floor, AND
 * `.for(client, id)` — the FE-2824 retarget the parity table signs — whose
 * target id comes from the CALLER and is therefore present whatever the session
 * is. The second shape is the one the guard has to hold on its own; a suite
 * that drives only the first cannot tell an authentication gate from an
 * "is there an id" gate, because on that path the two are the same question.
 * The playground reaches it at `/scenarios/client-emails/as/client/for/client/<id>`.
 *
 * ## What Breaks If These Fail
 * An unauthenticated caller reaches a client's email collection at all — the
 * one thing legacy's `<guard :if-client>` never allowed.
 */

import { describe, expect, it } from "vitest";
import { useClientEmailManager, useClientEmails } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useSessionStore } from "../../session-store";
import { ClientEmailsContextTypes } from "../client-email.types";
import {
  installBackgroundStubs,
  observeEmailRequests,
  recorded,
  resetClientEmailScopes
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

  it("AC-10 rejects a FORCED read on a caller-supplied client id, and reaches that client's resource not at all", async () => {
    await bootUnauthenticated();
    resetClientEmailScopes();
    // The id a caller can name without a session: the owning client of a
    // recorded row, read off the capture rather than invented.
    const targetClientId = recorded.one().data.client_id;
    const observed = observeEmailRequests();

    const emails = useClientEmails()
      .as(ScopeActorTypes.CLIENT)
      .for(ClientEmailsContextTypes.CLIENT, targetClientId);

    // Forced, not passive: an idle collection makes no request whatever the
    // guard does, so absence alone measures laziness rather than the gate.
    const settled = await settlement(emails.useActions().refresh());
    observed.stop();

    expect(settled).toBeInstanceOf(NotAuthenticatedError);
    expect(observed.matching(`/clients/${targetClientId}/emails`)).toEqual([]);
  });

  it("AC-3 reports a caller-retargeted collection unavailable while the session never authenticates", async () => {
    await bootUnauthenticated();
    resetClientEmailScopes();
    const targetClientId = recorded.one().data.client_id;

    const meta = useClientEmails()
      .as(ScopeActorTypes.CLIENT)
      .for(ClientEmailsContextTypes.CLIENT, targetClientId)
      .useMeta();

    await new Promise(resolve => setTimeout(resolve, 400));

    expect(meta.isAvailable.value).toBe(false);
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
