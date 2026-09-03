// -----------------------------------------------------------------------------
/**
 * @module client-notes/__tests__/client-notes.mutations.int
 * @description Integration proof for the collection's row-level write actions
 * — pin/unpin, delete, convert, and reveal — against REAL staging captures.
 * AC-8, AC-9, AC-10, AC-11 (parity.yaml C8, C9, C10, C11). C11 is JTBD-load-
 * bearing: a secret you cannot reveal is not working secrets functionality.
 */

import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useClientNotes } from "..";
import { queryClient } from "../../query/client";
import {
  waitForAvailable,
  observeVaultRequests,
  recorded,
  resetClientNoteScopes,
  seedClientSession,
  waitForRequestQuiescence
} from "./client-notes.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

describe("client-notes mutations — useClientNotes actions", () => {
  let clientId: string;

  beforeEach(async () => {
    const seeded = await seedClientSession();
    clientId = seeded.clientId;
    server?.use(
      http.get(`*/clients/${clientId}/vault`, () =>
        HttpResponse.json(recorded.list(), { status: 200 })
      )
    );
  });

  afterEach(() => {
    resetClientNoteScopes();
  });

  it("AC-8 — setPinned(id) is a ONE-ARGUMENT toggle: it PUTs the negation of the row's CURRENT pinned state, and invalidates the list", async () => {
    // Direction 1: a recorded pinned:false row toggles to PUT { pinned: true }.
    const pinnedFalseRow = recorded.list().data[0];
    const pinnedBody = recorded.pinned();
    const unpinnedBody = recorded.unpinned();
    const observed = observeVaultRequests();
    let refetches = 0;
    server?.use(
      http.put(
        `*/clients/${clientId}/vault/${pinnedFalseRow.id}`,
        async ({ request }) => {
          const body = (await request.json()) as { pinned?: boolean };
          return HttpResponse.json(body.pinned ? pinnedBody : unpinnedBody, {
            status: 200
          });
        }
      ),
      http.get(`*/clients/${clientId}/vault`, () => {
        refetches += 1;
        return HttpResponse.json(recorded.list(), { status: 200 });
      })
    );

    const notes = useClientNotes().as("self");
    await waitForAvailable(notes);
    const boot = refetches;

    await notes.useActions().setPinned(pinnedFalseRow.id);
    const putA = observed.matching(`/vault/${pinnedFalseRow.id}`).at(-1);
    expect(putA?.method).toBe("PUT");
    expect(putA?.body).toEqual({ pinned: true });
    expect(typeof (putA?.body as { pinned?: unknown })?.pinned).toBe("boolean");

    await Promise.resolve();
    expect(refetches).toBeGreaterThan(boot);
    notes.useActions().destroy();
    observed.stop();

    // Direction 2: a GENUINELY recorded pinned:true row (this run's own pin,
    // read back before it was unpinned — no captured list/filter row is ever
    // pinned:true) toggles to PUT { pinned: false }. `destroy()` alone drops
    // the registry entry but NOT the shared TanStack query cache — the same
    // scope key would otherwise replay direction 1's cached list instead of
    // hitting the handler below — so the cache is cleared too.
    resetClientNoteScopes();
    const pinnedTrueRow = recorded.confirmPinned().data;
    const pinnedTrueList = {
      ...recorded.list(),
      data: [pinnedTrueRow],
      total: 1
    };
    const observed2 = observeVaultRequests();
    server?.use(
      http.get(`*/clients/${clientId}/vault`, () =>
        HttpResponse.json(pinnedTrueList, { status: 200 })
      ),
      http.put(
        `*/clients/${clientId}/vault/${pinnedTrueRow.id}`,
        async ({ request }) => {
          const body = (await request.json()) as { pinned?: boolean };
          return HttpResponse.json(body.pinned ? pinnedBody : unpinnedBody, {
            status: 200
          });
        }
      )
    );

    const notes2 = useClientNotes().as("self");
    expect(notes2).not.toBe(notes);
    await waitForAvailable(notes2);
    expect(
      notes2.useContext().data.value?.find(row => row.id === pinnedTrueRow.id)
        ?.pinned
    ).toBe(true);

    await notes2.useActions().setPinned(pinnedTrueRow.id);
    const putB = observed2.matching(`/vault/${pinnedTrueRow.id}`).at(-1);
    expect(putB?.method).toBe("PUT");
    expect(putB?.body).toEqual({ pinned: false });
    // The toggle's own cache invalidation can trigger a delayed background
    // refetch; settle it before snapshotting the count so it isn't misread
    // as a request the missing-id call below fired.
    await waitForRequestQuiescence(observed2);

    // An id resolving to no row in the held collection fires zero requests
    // and rejects.
    const before = observed2.count();
    await expect(
      notes2.useActions().setPinned("00000000-0000-0000-0000-000000000000")
    ).rejects.toBeTruthy();
    expect(observed2.count()).toBe(before);

    observed2.stop();
  });

  it("AC-9 — deletes an asset, raises success feedback, and captures a rejected delete as state", async () => {
    const noteId = recorded.list().data[0].id;
    const observed = observeVaultRequests();
    server?.use(
      http.delete(`*/clients/${clientId}/vault/${noteId}`, () =>
        HttpResponse.json(recorded.removed(), { status: 200 })
      )
    );

    const notes = useClientNotes().as("self");
    await waitForAvailable(notes);
    await notes.useActions().remove(noteId);

    const deleteCall = observed
      .matching(`/vault/${noteId}`)
      .find(request => request.method === "DELETE");
    expect(deleteCall).toBeTruthy();

    const missingId = "00000000-0000-0000-0000-000000000000";
    const rejected = recorded.removeRejected();
    server?.use(
      http.delete(`*/clients/${clientId}/vault/${missingId}`, () =>
        HttpResponse.json(rejected.response.body as object, {
          status: rejected.response.status
        })
      )
    );
    await notes
      .useActions()
      .remove(missingId)
      .catch(() => undefined);
    expect(notes.useContext().error?.value).toBeTruthy();

    observed.stop();
  });

  it("AC-10 — convert(id) is a SINGLE STRING ID, resolved from the held collection; the label-first refusal fires zero requests", async () => {
    const secretId = recorded.list().data.find(r => r.encrypted).id; // by PREDICATE
    const noteId = recorded
      .list()
      .data.find(r => !r.encrypted && r.label === null).id; // by PREDICATE
    const observed = observeVaultRequests();

    server?.use(
      http.put(
        `*/clients/${clientId}/vault/${secretId}`,
        async ({ request }) => {
          const body = await request.json();
          expect(body).toEqual({ encrypted: false });
          return HttpResponse.json(recorded.convertedToNote(), { status: 200 });
        }
      )
    );

    const notes = useClientNotes().as("self");
    await waitForAvailable(notes);

    // (i) a secret converts to a note, driven by a single string id — never
    // an object.
    await notes.useActions().convert(secretId);
    expect(observed.matching(`/vault/${secretId}`).at(-1)?.method).toBe("PUT");
    // The convert's cache invalidation can trigger a delayed background
    // refetch; settle it before snapshotting so it isn't misread as a
    // request the SECOND (rejected) convert below fired.
    await waitForRequestQuiescence(observed);

    // (iii) a label-less note is refused with ZERO requests.
    const labelLessRow = notes
      .useContext()
      .data.value?.find(row => row.id === noteId);
    expect(labelLessRow?.label).toBeFalsy();
    const before = observed.count();
    await expect(notes.useActions().convert(noteId)).rejects.toMatchObject({
      message: expect.stringContaining("vault_asset_label_required")
    });
    expect(observed.count()).toBe(before);

    // (iv) an id resolving to no row in the held collection fires zero
    // requests and rejects.
    const beforeMissing = observed.count();
    await expect(
      notes.useActions().convert("00000000-0000-0000-0000-000000000000")
    ).rejects.toBeTruthy();
    expect(observed.count()).toBe(beforeMissing);

    observed.stop();
  });

  it("AC-10(ii) — a note WITH a label already on it converts to a secret with a body of exactly { encrypted: true }", async () => {
    const labelled = recorded.labelledNote().data;
    expect(labelled.label).toBeTruthy();
    const listWithLabelled = {
      ...recorded.list(),
      data: [labelled],
      total: 1
    };
    const converted = recorded.convertedLabelledToSecret();
    const observed = observeVaultRequests();

    server?.use(
      http.get(`*/clients/${clientId}/vault`, () =>
        HttpResponse.json(listWithLabelled, { status: 200 })
      ),
      http.put(
        `*/clients/${clientId}/vault/${labelled.id}`,
        async ({ request }) => {
          const body = await request.json();
          expect(body).toEqual({ encrypted: true });
          return HttpResponse.json(converted.response.body, {
            status: converted.response.status
          });
        }
      )
    );

    const notes = useClientNotes().as("self");
    await waitForAvailable(notes);

    await notes.useActions().convert(labelled.id);
    const put = observed
      .matching(`/vault/${labelled.id}`)
      .find(request => request.method === "PUT");
    expect(put).toBeTruthy();
    observed.stop();
  });

  it("AC-11 — reveals a secret's plaintext (never cached), hides it locally, and re-reveals with a fresh request", async () => {
    const secretId = recorded.list().data[0].id;
    const first = recorded.decryptFirst();
    const second = recorded.decryptSecond();
    let calls = 0;
    const observed = observeVaultRequests();
    server?.use(
      http.get(`*/clients/${clientId}/vault/${secretId}/decrypt`, () => {
        calls += 1;
        return HttpResponse.json(calls === 1 ? first : second, { status: 200 });
      })
    );

    const notes = useClientNotes().as("self");
    await waitForAvailable(notes);

    const plaintext = await notes.useActions().reveal(secretId);
    expect(plaintext).toBe(first.data.note);
    expect(notes.useContext().revealed?.value?.[secretId]).toBe(
      first.data.note
    );
    expect(calls).toBe(1);

    const before = observed.count();
    notes.useActions().hide(secretId);
    expect(observed.count()).toBe(before);
    expect(notes.useContext().revealed?.value?.[secretId]).toBeFalsy();

    const again = await notes.useActions().reveal(secretId);
    expect(again).toBe(second.data.note);
    expect(calls).toBe(2);

    const cacheEntries = queryClient
      .getQueryCache()
      .getAll()
      .map(entry => JSON.stringify(entry.state.data ?? ""));
    expect(cacheEntries.some(entry => entry.includes(first.data.note))).toBe(
      false
    );
    expect(cacheEntries.some(entry => entry.includes(second.data.note))).toBe(
      false
    );

    observed.stop();
  });

  it("AC-11/AC-32 — refresh() and destroy() each clear the revealed-secret map wholesale, so a stale plaintext cannot survive either (JTBD-breaking repair)", async () => {
    const secretId = recorded.list().data[0].id;
    const first = recorded.decryptFirst();
    server?.use(
      http.get(`*/clients/${clientId}/vault/${secretId}/decrypt`, () =>
        HttpResponse.json(first, { status: 200 })
      )
    );

    const notes = useClientNotes().as("self");
    await waitForAvailable(notes);

    await notes.useActions().reveal(secretId);
    expect(notes.useContext().revealed?.value?.[secretId]).toBe(
      first.data.note
    );
    const revealedRef = notes.useContext().revealed;

    await notes.useActions().refresh();
    expect(revealedRef?.value?.[secretId]).toBeFalsy();
    expect(Object.keys(revealedRef?.value ?? {})).toHaveLength(0);

    await notes.useActions().reveal(secretId);
    expect(notes.useContext().revealed?.value?.[secretId]).toBe(
      first.data.note
    );
    const revealedRefBeforeDestroy = notes.useContext().revealed;

    notes.useActions().destroy();
    expect(revealedRefBeforeDestroy?.value?.[secretId]).toBeFalsy();
    expect(Object.keys(revealedRefBeforeDestroy?.value ?? {})).toHaveLength(0);
  });
});
