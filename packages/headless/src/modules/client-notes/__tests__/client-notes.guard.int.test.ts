// -----------------------------------------------------------------------------
/**
 * @module client-notes/__tests__/client-notes.guard.int
 * @description Integration proof for the module's guard rails — the brand
 * feature gate, the staged-import read-only rule, loading/empty/error state,
 * and the never-hangs readiness bound. AC-14, AC-15, AC-16, AC-17
 * (parity.yaml C14, C15, C17).
 *
 * AC-14's brand-DISABLED case lives alone in
 * `client-notes.guard-brand-disabled.int.test.ts` — see that file's
 * `@decision` for why (the brand-config persister's debounced localStorage
 * write outlives a same-file `afterEach` clear).
 */

import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useClientNotes } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useSessionStore } from "../../session-store";
import {
  installBackgroundStubs,
  logoutClientSession,
  observeVaultRequests,
  recorded,
  resetClientNoteScopes,
  seedAuthenticatedSessionWithoutClientId,
  seedClientSession,
  seedStagedImportClientSession,
  waitForAvailable
} from "./client-notes.int-helpers";
import { server } from "./setup.integration";
import { NotAuthenticatedError } from "../../../utils";

// -----------------------------------------------------------------------------

/**
 * Boots the store to the guest floor — no client session is ever added.
 *
 * Logs out first: `useSessionStore` is a real module-level singleton
 * (`code-composables.companion.md` "Singleton examples"), never reset by
 * `resetClientNoteScopes()` (which only evicts THIS module's scope registry
 * + query cache). Without an explicit logout, an earlier test's still-active
 * session in this file (AC-16 seeds one and never tears it down) leaks into
 * this "no addressable client" case and resolves it as authenticated —
 * caught live this cycle once AC-14/15/16's brand-config leak stopped
 * masking it.
 */
async function bootUnauthenticated(): Promise<void> {
  await logoutClientSession();
  installBackgroundStubs();
  await useSessionStore().initStore();
}

describe("client-notes guard rails — useClientNotes", () => {
  afterEach(() => {
    resetClientNoteScopes();
  });

  it("AC-14 — the vault is available and reads exactly once when the brand enables it", async () => {
    const { clientId } = await seedClientSession();
    const observed = observeVaultRequests();
    server?.use(
      http.get(`*/clients/${clientId}/vault`, () =>
        HttpResponse.json(recorded.list(), { status: 200 })
      )
    );

    const notes = useClientNotes().as(ScopeActorTypes.SELF);
    await waitForAvailable(notes);

    expect(notes.useMeta().isAvailable.value).toBe(true);
    expect(observed.count()).toBe(1);
    observed.stop();
  });

  // @blocked-on-platform — root cause: packages/headless/src/modules/session-store/session-store.mappers.ts
  // (the shared session-store layer, not this module). `staged_import` on the
  // wire session payload never reaches the mapped `SessionUser`, so
  // `isDisabled` can never observe it and can never go true — predicted at
  // the Code stage, confirmed at source. Operator ruling, 2026-08-28:
  // pre-existing platform defect, filed rather than fixed in this run. This
  // test's assertions (`isDisabled.value` true, `observed.count()` unchanged
  // after the three refused writes) are CORRECT; the platform mapper is
  // wrong. Do NOT weaken these assertions to make it pass. Delete this
  // `.skip` (and this comment) once session-store.mappers.ts is fixed — the
  // test will then prove the fix by going green on its own.
  it.skip("AC-15 — a staged-import client reads the vault (with_staged_imports=1) but every write refuses", async () => {
    const { clientId } = await seedStagedImportClientSession();
    const observed = observeVaultRequests();
    server?.use(
      http.get(`*/clients/${clientId}/vault`, () =>
        HttpResponse.json(recorded.list(), { status: 200 })
      )
    );

    const notes = useClientNotes().as(ScopeActorTypes.SELF);
    await waitForAvailable(notes);

    const bootQuery = new URL(observed.first().url).searchParams;
    expect(bootQuery.get("with_staged_imports")).toBe("1");
    expect(notes.useMeta().isDisabled.value).toBe(true);

    const before = observed.count();
    const targetId = recorded.list().data[0].id;
    await Promise.allSettled([
      notes.useActions().remove(targetId),
      notes.useActions().setPinned(targetId, true),
      notes
        .useActions()
        .convert(
          notes
            .useContext()
            .data.value?.find(row => row.id === targetId) as never
        )
    ]);
    expect(observed.count()).toBe(before);
    observed.stop();
  });

  it("AC-16 — reports loading, then settled, and captures a recorded 500 as state rather than raising", async () => {
    const { clientId } = await seedClientSession();
    server?.use(
      http.get(`*/clients/${clientId}/vault`, () =>
        HttpResponse.json(
          {
            status: "error",
            data: null,
            error: { code: 500, message: "boom" }
          },
          { status: 500 }
        )
      )
    );

    const notes = useClientNotes().as(ScopeActorTypes.SELF);
    expect(notes.useMeta().isLoading.value).toBe(true);

    await vi.waitFor(
      () => {
        expect(notes.useMeta().isLoading.value).toBe(false);
      },
      { timeout: 5000, interval: 25 }
    );
    expect(notes.useMeta().hasError.value).toBe(true);
    expect(notes.useContext().error?.value).toBeTruthy();
  });

  it("AC-17 — isReady() resolves false, never hangs, when the session settles with no addressable client", async () => {
    await bootUnauthenticated();
    const observed = observeVaultRequests();

    const notes = useClientNotes().as(ScopeActorTypes.SELF);
    const settled = await Promise.race([
      notes.useActions().isReady(),
      new Promise(resolve => setTimeout(() => resolve("never-settled"), 3000))
    ]);

    expect(settled).toBe(false);
    expect(observed.all()).toEqual([]);
    observed.stop();
  });

  it("AC-17 — refresh() rejects NotAuthenticatedError on an unaddressable scope and fires no request", async () => {
    await seedAuthenticatedSessionWithoutClientId();
    const observed = observeVaultRequests();

    const notes = useClientNotes().as(ScopeActorTypes.SELF);
    await expect(notes.useActions().refresh()).rejects.toBeInstanceOf(
      NotAuthenticatedError
    );
    expect(observed.all()).toEqual([]);
    observed.stop();
  });
});
