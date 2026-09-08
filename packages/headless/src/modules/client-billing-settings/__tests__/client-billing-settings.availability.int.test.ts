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
 * ## What Breaks If These Fail
 * A staged-import client whose editor silently commits before the import
 * finishes processing, or a brand that never opted its clients in seeing a
 * control that cannot work.
 */

import { afterEach, describe, expect, it } from "vitest";
import { useBillingSettings, useBillingSettingsManager } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installRestrictToStaffHandler,
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

    expect(manager.useContext().isStaged.value).toBe(true);
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
    installRestrictToStaffHandler(server, {
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
    installRestrictToStaffHandler(server, {
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
    installRestrictToStaffHandler(server);

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
    installRestrictToStaffHandler(server, {
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
    installRestrictToStaffHandler(server, {
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
    installRestrictToStaffHandler(server);

    const manager = useBillingSettingsManager().as(ScopeActorTypes.CLIENT);
    await manager.useActions().isReady();

    expect(manager.useMeta().isVisible.value).toBe(true);
    manager.useActions().destroy();
  });
});
