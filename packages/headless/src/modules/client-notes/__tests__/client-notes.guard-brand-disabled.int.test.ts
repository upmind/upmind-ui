// -----------------------------------------------------------------------------
/**
 * @module client-notes/__tests__/client-notes.guard-brand-disabled.int
 * @description AC-14's brand-DISABLED case, split into its own file so it
 * never shares a Vitest module/global context with any other brand-config
 * boot in this module.
 *
 * @decision
 * what: this ONE case lives alone rather than alongside AC-14's enabled case
 *   (or AC-15/AC-16) in `client-notes.guard.int.test.ts`.
 * why: `brand.services.ts`'s `fetchBrandConfig` query carries
 *   `staleTime: "static"` plus a localStorage persister. Confirmed live
 *   (this repair cycle): even after `resetClientNoteScopes()` +
 *   `localStorage.clear()` in `afterEach`, this test's disabled-flag write
 *   was still observable by the NEXT test in the same file — the persister's
 *   write to localStorage is debounced past the gap between tests, so the
 *   clear in `afterEach` races (and loses to) the pending write. Vitest's
 *   default per-file isolation (`pool: "forks"`, `isolate: true` — see
 *   `vitest.config.ts`) tears down and rebuilds the whole global context
 *   (including `localStorage`) between FILES, which a same-file `afterEach`
 *   cannot do mid-run. Isolating the disabled case to its own file is the
 *   test-side half of closing that leak; `brand.services.ts`'s persister
 *   itself is outside this module's write lane (platform code) and is
 *   recorded as a finding in the hand-off, not patched here.
 * rejected: a longer `afterEach` sleep or a retry around `isAvailable` —
 *   both hide the leak rather than removing it (explicit instruction this
 *   cycle), and neither closes the race for any FUTURE module that also
 *   boots off brand config in the same file as a disabled-flag case.
 */

import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { useClientNotes } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  observeVaultRequests,
  recorded,
  resetClientNoteScopes,
  seedClientSession
} from "./client-notes.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

describe("client-notes guard rails — useClientNotes (brand disabled, isolated)", () => {
  it("AC-14 — the vault is unavailable when the brand disables it, and fires no request", async () => {
    resetClientNoteScopes();
    const enabledFlag = recorded.brandVaultFlag();
    const disabledFlag = {
      ...enabledFlag,
      data: { "security.ui.allow_vault": false }
    };
    server?.use(
      http.get("*/org/modules", () => HttpResponse.json(recorded.orgModules())),
      http.get("*/brand/settings", () =>
        HttpResponse.json(recorded.brandSettings())
      ),
      http.get("*/config/brand/values", () => HttpResponse.json(disabledFlag))
    );

    const { clientId } = await seedClientSession();
    const observed = observeVaultRequests();
    server?.use(
      http.get(`*/clients/${clientId}/vault`, () =>
        HttpResponse.json(recorded.list(), { status: 200 })
      )
    );

    const notes = useClientNotes().as(ScopeActorTypes.SELF);
    await new Promise(resolve => setTimeout(resolve, 300));

    expect(notes.useMeta().isAvailable.value).toBe(false);
    expect(observed.all()).toEqual([]);
    observed.stop();
  });
});
