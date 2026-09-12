// -----------------------------------------------------------------------------
/**
 * @fileoverview client-billing-settings — honest availability (AC-14, AC-17)
 *
 * ## Job To Be Done
 * Drive the REAL `useBillingSettingsManager()` THROUGH THE BARREL against
 * MSW-replayed staging recordings and prove: a staged, not-yet-processed
 * import record locks every control and refuses to commit, with zero
 * requests (AC-14, row C14); and the surface is hidden from a client unless
 * the brand's `invoices.consolidation.restrict_to_staff` config value
 * resolves to a literal `false` — a missing or `true` value keeps it hidden
 * (AC-17, row O8). The default-hidden polarity is the oracle's own
 * (`comp:72-79`'s `?? true`), not an invention, and getting it backwards
 * would expose the surface to every brand that never opted in. AC-17's gate
 * is asserted on BOTH halves design.md §8.2 names — `useBillingSettings()`
 * and `useBillingSettingsManager()` — since each resolves its own
 * `useMeta().isVisible` and a fix to one can leave the other still exposing
 * the surface by default.
 *
 * Each brand-gate variant is the SAME recorded envelope with ONLY the one
 * key under test overridden — never a fabricated body — mirroring the
 * exemplar's own `required: true` single-flag-override technique.
 *
 * Also proves the visibility gate's error recovery (AC-17): a failed
 * one-shot brand-config read leaves the surface hidden (failing CLOSED
 * stays correct) AND is exposed to the consumer via
 * `useMeta().hasVisibilityError`, rather than staying silent forever; a
 * subsequent `useActions().refresh()` re-attempts the read and a
 * now-succeeding fetch resolves the surface correctly.
 *
 * ## What Breaks If These Fail
 * A staged-import client whose editor silently commits before the import
 * finishes processing, a brand that never opted its clients in seeing a
 * control that cannot work, or a client stuck with a hidden surface and no
 * way to tell it was a transient failure rather than a brand decision.
 */

import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useBillingSettings, useBillingSettingsManager } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installBrandGatesHandler,
  installSettingsGetHandler,
  installSettingsPutEchoHandler,
  observeClientRequests,
  recorded,
  resetClientBillingSettingsScopes,
  seedClientSession
} from "./client-billing-settings.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

afterEach(() => {
  resetClientBillingSettingsScopes();
});

// Runs FIRST, deliberately, ahead of every other describe block below: this
// is the only test in the file whose visibility read is made to FAIL, and
// the brand-config gate it drives (`useBrand().ensureConfig()`) is a
// module-wide singleton (design.md §5.2/§8.2, useBrand.ts:69) that never
// re-issues a request once any earlier test in this FILE has already
// resolved it successfully. Every other describe block below resolves it
// successfully, so this one must run before any of them do.
describe("useBillingSettings — the visibility gate recovers and reports on refresh (AC-17)", () => {
  it("AC17 a failed visibility read stays hidden and visible, then recovers on refresh", async () => {
    const { clientId } = await seedClientSession();
    installSettingsGetHandler(server, clientId, recorded.settings());
    server?.use(
      http.get("*/config/brand/values*", () =>
        HttpResponse.json({ status: "error", data: null }, { status: 500 })
      )
    );

    const settings = useBillingSettings().as(ScopeActorTypes.CLIENT);
    await settings.useActions().isReady();

    await vi.waitFor(
      () => {
        expect(settings.useMeta().isVisible.value).toBe(false);
        expect(settings.useMeta().hasVisibilityError.value).toBe(true);
      },
      { timeout: 15000 }
    );

    installBrandGatesHandler(server);
    await settings.useActions().refresh();

    await vi.waitFor(
      () => {
        expect(settings.useMeta().isVisible.value).toBe(true);
        expect(settings.useMeta().hasVisibilityError.value).toBe(false);
      },
      { timeout: 15000 }
    );
    settings.useActions().destroy();
  }, 20000);
});

const stagedSettingsFixture = {
  ...recorded.settings(),
  data: { ...recorded.settings().data, staged_import: true }
};

describe("useBillingSettingsManager — a staged import locks every control (AC-14)", () => {
  it("AC14 a staged-import record locks every control and refuses to commit", async () => {
    const { clientId } = await seedClientSession();
    installSettingsGetHandler(server, clientId, stagedSettingsFixture);
    const put = installSettingsPutEchoHandler(
      server,
      clientId,
      stagedSettingsFixture
    );

    const manager = useBillingSettingsManager().as(ScopeActorTypes.CLIENT);
    await manager.useActions().isReady();

    expect(manager.useMeta().isStaged.value).toBe(true);
    expect(manager.useMeta().isEditable.value).toBe(false);

    const observed = observeClientRequests();
    await manager.useActions().input({ enabled: 0 });
    await manager
      .useActions()
      .update()
      .catch(() => undefined);
    observed.stop();

    expect(
      observed.all().filter(request => request.method === "PUT")
    ).toHaveLength(0);
    expect(put.bodies()).toHaveLength(0);
    manager.useActions().destroy();
  });
});

describe("useBillingSettings — the surface is hidden unless the brand opts clients in (AC-17)", () => {
  it("AC17 the surface is hidden unless the brand opts clients in — key absent", async () => {
    const { clientId } = await seedClientSession();
    installSettingsGetHandler(server, clientId, recorded.settings());
    installBrandGatesHandler(server, {
      status: "ok",
      data: {},
      related: null,
      total: null,
      error: null,
      messages: [],
      meta: null
    });

    const settings = useBillingSettings().as(ScopeActorTypes.CLIENT);
    await settings.useActions().isReady();

    expect(settings.useMeta().isVisible.value).toBe(false);
    settings.useActions().destroy();
  });

  it("AC17 the surface is hidden unless the brand opts clients in — key true", async () => {
    const { clientId } = await seedClientSession();
    installSettingsGetHandler(server, clientId, recorded.settings());
    const restrictToStaffFixture = recorded.restrictToStaff();
    installBrandGatesHandler(server, {
      ...(restrictToStaffFixture.response.body as object),
      data: { "invoices.consolidation.restrict_to_staff": true }
    });

    const settings = useBillingSettings().as(ScopeActorTypes.CLIENT);
    await settings.useActions().isReady();

    expect(settings.useMeta().isVisible.value).toBe(false);
    settings.useActions().destroy();
  });

  it("AC17 the surface is hidden unless the brand opts clients in — key false (the real recorded value)", async () => {
    const { clientId } = await seedClientSession();
    installSettingsGetHandler(server, clientId, recorded.settings());
    installBrandGatesHandler(server);

    const settings = useBillingSettings().as(ScopeActorTypes.CLIENT);
    await settings.useActions().isReady();

    expect(settings.useMeta().isVisible.value).toBe(true);
    settings.useActions().destroy();
  });
});

describe("useBillingSettingsManager — the surface is hidden unless the brand opts clients in (AC-17)", () => {
  it("AC17 the surface is hidden unless the brand opts clients in — key absent", async () => {
    const { clientId } = await seedClientSession();
    installSettingsGetHandler(server, clientId, recorded.settings());
    installBrandGatesHandler(server, {
      status: "ok",
      data: {},
      related: null,
      total: null,
      error: null,
      messages: [],
      meta: null
    });

    const manager = useBillingSettingsManager().as(ScopeActorTypes.CLIENT);
    await manager.useActions().isReady();

    expect(manager.useMeta().isVisible.value).toBe(false);
    manager.useActions().destroy();
  });

  it("AC17 the surface is hidden unless the brand opts clients in — key true", async () => {
    const { clientId } = await seedClientSession();
    installSettingsGetHandler(server, clientId, recorded.settings());
    const restrictToStaffFixture = recorded.restrictToStaff();
    installBrandGatesHandler(server, {
      ...(restrictToStaffFixture.response.body as object),
      data: { "invoices.consolidation.restrict_to_staff": true }
    });

    const manager = useBillingSettingsManager().as(ScopeActorTypes.CLIENT);
    await manager.useActions().isReady();

    expect(manager.useMeta().isVisible.value).toBe(false);
    manager.useActions().destroy();
  });

  it("AC17 the surface is hidden unless the brand opts clients in — key false (the real recorded value)", async () => {
    const { clientId } = await seedClientSession();
    installSettingsGetHandler(server, clientId, recorded.settings());
    installBrandGatesHandler(server);

    const manager = useBillingSettingsManager().as(ScopeActorTypes.CLIENT);
    await manager.useActions().isReady();

    expect(manager.useMeta().isVisible.value).toBe(true);
    manager.useActions().destroy();
  });
});
