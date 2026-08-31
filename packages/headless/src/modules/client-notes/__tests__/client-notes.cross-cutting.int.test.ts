// -----------------------------------------------------------------------------
/**
 * @module client-notes/__tests__/client-notes.cross-cutting.int
 * @description Cross-cutting proofs that hold across BOTH composables.
 * AC-27 (one identity seam), AC-29 (the criteria schema is the ONLY door to
 * request state), AC-30 (every declared sort column proven against the live
 * API), AC-34 (a revealed secret must not outlive the session that revealed
 * it — the cross-client plaintext exposure closed per operator ruling
 * 2026-08-28, parity.yaml row X8, design decision B6). parity.yaml rows
 * C7/X4/X5/X8.
 *
 * AC-29's negative control, `client-notes.criteria-channel-reaches-wire.must-fail.patch`
 * (developer-authored, prover-applied blind per `agent-seat-separation.companion.md`),
 * is ABSENT from this write lane at the time this spec was authored — recorded
 * as a structured finding in the Test-stage hand-off, not silently skipped.
 * The same holds for AC-34's own mutant — absent for the same reason,
 * tracked the same way.
 */

import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { useClientNoteManager, useClientNotes } from "..";
import { getRegistry } from "../../scope/scope.registry";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  mapSessionUser,
  useActiveSession,
  useSessionStore
} from "../../session-store";
import * as sessionStoreSync from "../../session-store/session-store.sync";
import { ClientNoteContextTypes } from "../client-notes.types";
import {
  waitForAvailable,
  assertClientIdentityTransport,
  clientNoteScopeKeys,
  observeVaultRequests,
  recorded,
  resetClientNoteScopes,
  seedClientSession,
  sessionStoreRecordingsDir,
  waitForRequestQuiescence
} from "./client-notes.int-helpers";
import { server } from "./setup.integration";
import type { IToken } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

describe("client-notes cross-cutting", () => {
  let clientId: string;
  let accessToken: string;

  beforeEach(async () => {
    const seeded = await seedClientSession();
    clientId = seeded.clientId;
    accessToken = seeded.accessToken;
  });

  afterEach(() => {
    resetClientNoteScopes();
  });

  it("AC-27 — a collection read and a manager save both address the same client through one identity seam", async () => {
    const list = recorded.list();
    const noteRow = list.data[1];
    const oneEnvelope = { ...recorded.one(), data: noteRow };
    const edited = recorded.edited();
    const observed = observeVaultRequests();

    server?.use(
      http.get(`*/clients/${clientId}/vault`, () =>
        HttpResponse.json(list, { status: 200 })
      ),
      http.get(`*/clients/${clientId}/vault/${noteRow.id}`, () =>
        HttpResponse.json(oneEnvelope, { status: 200 })
      ),
      http.put(`*/clients/${clientId}/vault/${noteRow.id}`, () =>
        HttpResponse.json(edited, { status: 200 })
      )
    );

    const notes = useClientNotes().as(ScopeActorTypes.SELF);
    await waitForAvailable(notes);

    const manager = useClientNoteManager()
      .as(ScopeActorTypes.SELF)
      .for(ClientNoteContextTypes.NOTE, noteRow.id);
    await waitForAvailable(manager);
    await vi.waitFor(() => {
      expect(manager.useContext().model.value?.note).toBeTruthy();
    });
    await manager.useActions().update({ note: "changed" } as never);

    const requests = observed.all();
    expect(requests.length).toBeGreaterThanOrEqual(2);
    for (const request of requests) {
      assertClientIdentityTransport(request, clientId, accessToken);
    }
    observed.stop();
  });

  /**
   * AC-34. The defect (parity.yaml X8, design decision B6): `generateScopeKey`
   * keys `useClientNotes().as('self')` to `client-notes:client` — no client id
   * — so the module-global scope registry serves the SAME cached instance
   * (and the SAME `revealed` closure) to whoever is authenticated next on
   * this device. The fix subscribes that instance to the session's own
   * `onLogout` signal and clears `revealed` wholesale; it does NOT change the
   * key shape (X8 stays open).
   *
   * The ref is held ACROSS the logout — the AC-32 precedent
   * (`client-notes.mutations.int.test.ts`) — because re-fetching a FRESH
   * `.useContext()` after logout would pass even if the original closure
   * still held the plaintext; only the SAME reference can prove it was
   * actually cleared, not merely that a new read started clean.
   *
   * `logoutClientSession()` is deliberately NOT used here: it calls
   * `resetClientNoteScopes()`, which evicts the registry entry itself — that
   * would launder the exact defect this test exists to catch by forcing a
   * fresh instance on the next `.as('self')` regardless of whether the real
   * fix works. This test drives the real `useSessionStore` logout/login
   * actions directly and never touches the registry.
   */
  it("AC-34 — a secret I revealed does not outlive my session, even served from the same registry entry to whoever logs in next", async () => {
    const secretId = recorded.list().data[0].id;
    server?.use(
      http.get(`*/clients/${clientId}/vault/${secretId}/decrypt`, () =>
        HttpResponse.json(recorded.decryptFirst(), { status: 200 })
      )
    );

    const notes = useClientNotes().as(ScopeActorTypes.SELF);
    await waitForAvailable(notes);

    const keysAfterFirstMint = clientNoteScopeKeys();
    expect(keysAfterFirstMint).toEqual(["client-notes:client"]);
    const registryEntry = getRegistry().get(keysAfterFirstMint[0]);

    await notes.useActions().reveal(secretId);
    const revealedRef = notes.useContext().revealed;
    expect(revealedRef?.value?.[secretId]).toBe(
      recorded.decryptFirst().data.note
    );

    useSessionStore().useActions().logout();
    await vi.waitFor(() => {
      expect(useActiveSession().useMeta().isAuthenticated.value).toBe(false);
    });
    expect(revealedRef?.value?.[secretId]).toBeFalsy();

    // "Another client signs in on the same device": re-authenticate WITHOUT
    // ever calling resetClientNoteScopes(). Only one client is under capture
    // (client-notes.int-helpers.ts), so the vehicle is the SAME recorded
    // credentials — the exposure is that the scope key carries no client id
    // at all, not that this particular id differs from that one.
    const clientToken = getFixtureBody<IToken>(
      "post-oauth-access-token-client",
      {
        recordingsDir: sessionStoreRecordingsDir
      }
    );
    const selfBody = getFixtureBody<{ data: { actor: { id: string } } }>(
      "get-self",
      { recordingsDir: sessionStoreRecordingsDir }
    );
    await useSessionStore()
      .useActions()
      .add(clientToken, true, mapSessionUser(selfBody.data as never));
    await vi.waitFor(() => {
      expect(useActiveSession().useMeta().isAuthenticated.value).toBe(true);
    });

    const secondLoginKeys = clientNoteScopeKeys();
    expect(secondLoginKeys).toEqual(["client-notes:client"]);
    expect(getRegistry().get(secondLoginKeys[0])).toBe(registryEntry);

    const secondInstance = useClientNotes().as(ScopeActorTypes.SELF);
    expect(secondInstance.useContext().revealed?.value?.[secretId]).toBeFalsy();
    expect(revealedRef?.value?.[secretId]).toBeFalsy();
  });

  /**
   * AC-34 (destroy()-side). The prior version of this control asserted
   * `expect(() => logout()).not.toThrow()` after `destroy()` — a tautology:
   * the subscribed callback's entire body is `revealed.value = {}`, an
   * assignment to a ref still alive in the closure regardless of whether the
   * unsubscribe ran, and `notifyLogoutSubscribers` is a bare
   * `forEach(cb => cb(actor))` with no other failure mode. It could not go
   * RED for the defect it names.
   *
   * `revealed` itself can't carry the discriminator either: design.md D9 /
   * the AC-32 precedent (`client-notes.mutations.int.test.ts`) already has
   * `destroy()` clear `revealed` on its own, independent of the logout
   * subscription — so a destroyed instance's `revealed` reads empty either
   * way and the two behaviours (unsubscribed vs. leaked) are unobservable
   * through it.
   *
   * The discriminator this control uses instead: design.md D9 states the
   * subscription is made via `useSessionStore().useActions().onLogout(...)`,
   * which the module's own `.d.ts` (session-store.sync.d.ts) types as
   * `subscribeToLogout: (callback) => () => void` — a real, named export,
   * not a private. Wrapping that export lets the test capture the EXACT
   * unsubscribe function the mint call receives, without reading
   * client-notes' own implementation: it proves `destroy()` calls that
   * specific function, which is the actual mechanism `unsubscribeLogout()`
   * exercises, one layer up from any effect the callback body has.
   */
  it("AC-34 — destroy() invokes the unsubscribe function the logout subscription returned at mint time", async () => {
    const realSubscribeToLogout = sessionStoreSync.subscribeToLogout;
    const unsubscribeSpies: Array<ReturnType<typeof vi.fn>> = [];
    const subscribeSpy = vi
      .spyOn(sessionStoreSync, "subscribeToLogout")
      .mockImplementation(callback => {
        const realUnsubscribe = realSubscribeToLogout(callback);
        const wrappedUnsubscribe = vi.fn(realUnsubscribe);
        unsubscribeSpies.push(wrappedUnsubscribe);
        return wrappedUnsubscribe;
      });

    try {
      const notes = useClientNotes().as(ScopeActorTypes.SELF);
      await waitForAvailable(notes);

      expect(subscribeSpy).toHaveBeenCalledTimes(1);
      expect(unsubscribeSpies).toHaveLength(1);
      expect(unsubscribeSpies[0]).not.toHaveBeenCalled();

      notes.useActions().destroy();

      expect(unsubscribeSpies[0]).toHaveBeenCalledTimes(1);
    } finally {
      subscribeSpy.mockRestore();
    }
  });

  // @blocked-on-platform — root cause: packages/headless/src/modules/query/useQueryCriteria.ts
  // (the shared query layer, not this module). An ajv-rejected criteria write
  // mutates live criteria state and re-issues a request instead of leaving
  // the criteria standing and firing nothing — the criteria-subversion law,
  // broken for every module that consumes useQueryCriteria, not just this one.
  // Operator ruling, 2026-08-28: pre-existing platform defect, filed rather
  // than fixed in this run. This test and its `toBe(beforeInvalid)` assertion
  // are CORRECT and are what caught the defect; the platform is wrong. Do
  // NOT weaken this assertion to make it pass. Delete this `.skip` (and this
  // comment) once useQueryCriteria.ts is fixed — the test will then prove
  // the fix by going green on its own.
  it.skip("AC-29 — filterBy / sortBy / setCriteria each reach the wire; an undeclared key is rejected, never sent", async () => {
    const list = recorded.list();
    const observed = observeVaultRequests();
    server?.use(
      http.get(`*/clients/${clientId}/vault`, () =>
        HttpResponse.json(list, { status: 200 })
      )
    );

    const notes = useClientNotes().as(ScopeActorTypes.SELF);
    await waitForAvailable(notes);
    const boot = observed.count();

    notes.useActions().filterBy({ label: { like: "x" } });
    await vi.waitFor(() => {
      expect(observed.count()).toBeGreaterThan(boot);
    });

    const afterFilter = observed.count();
    notes
      .useActions()
      .sortBy([{ field: "label", dir: "asc" as never }] as never);
    await vi.waitFor(() => {
      expect(observed.count()).toBeGreaterThan(afterFilter);
    });

    const afterSort = observed.count();
    notes.useActions().setCriteria({ pagination: { limit: 5 } } as never);
    await vi.waitFor(() => {
      expect(observed.count()).toBeGreaterThan(afterSort);
    });
    // A cache invalidation can trigger a background refetch on a delay this
    // suite does not control — settle to a genuinely stable count (not a
    // fixed sleep) before the invalid write's "fires nothing" claim is
    // checked against it.
    await waitForRequestQuiescence(observed);

    const beforeInvalid = observed.count();
    expect(() =>
      notes.useActions().filterBy({ nope: { eq: 1 } } as never)
    ).not.toThrow();
    await waitForRequestQuiescence(observed);
    expect(observed.count()).toBe(beforeInvalid);
    expect(notes.useContext().error?.value).toBeTruthy();

    observed.stop();
  });

  it("AC-30 — every declared sort column (label, pinned, created_at) x direction was captured with status 200 against the live API", () => {
    const columns: Array<"label" | "pinned" | "created_at"> = [
      "label",
      "pinned",
      "created_at"
    ];
    for (const field of columns) {
      for (const dir of ["asc", "desc"] as const) {
        const capture = recorded.order(field, dir);
        expect(
          capture.response.status,
          `order=${dir === "desc" ? "-" : ""}${field} returned ${capture.response.status}`
        ).toBe(200);
      }
    }
  });
});
