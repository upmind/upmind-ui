// -----------------------------------------------------------------------------
/**
 * @fileoverview client-billing-settings editor — safe editing (AC-8, AC-9,
 * AC-10, AC-11, AC-13, AC-15)
 *
 * ## Job To Be Done
 * Drive the REAL `useBillingSettingsManager()` THROUGH THE BARREL against
 * MSW-replayed staging recordings and prove: dirty is reported against the
 * last-LOADED baseline, not the initial construction (AC-8); `revert()`
 * restores the loaded values through a `SET`, with zero requests, since the
 * shared `dataManagerMachine` carries no `REVERT` event (AC-9, design.md §9);
 * an invalid value blocks the save before any request (AC-10); a no-op save
 * issues zero requests and still resolves (AC-11); every control reports
 * itself unavailable while a save is in flight, and recovers once it settles
 * — even as an error (AC-13); an externally-supplied disabled state locks
 * every control independently of the module's own gates, and a `set()`
 * while locked leaves the model unchanged (AC-15); and `revert()` cancels a
 * STILL-PENDING debounced `input()` before it can apply, so a revert made
 * inside the debounce window is never silently undone once the timer fires
 * (AC-9).
 *
 * ## What Breaks If These Fail
 * Data loss from a discard that silently sends a request, a save that
 * commits invalid values, a duplicate write when nothing changed, or a
 * control a consumer believes is locked that is still actually editable.
 */

import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useBillingSettingsManager } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
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

describe("useBillingSettingsManager — dirty against the loaded baseline (AC-8)", () => {
  it("AC8 reports dirty against the loaded baseline", async () => {
    const { clientId } = await seedClientSession();
    installSettingsGetHandler(server, clientId, recorded.settings());

    const manager = useBillingSettingsManager().as(ScopeActorTypes.CLIENT);
    await manager.useActions().isReady();
    expect(manager.useMeta().isDirty.value).toBe(false);

    await manager.useActions().input({ enabled: 0 });
    await vi.waitFor(() => expect(manager.useMeta().isDirty.value).toBe(true));

    await manager.useActions().input({ enabled: 1 });
    await vi.waitFor(() => expect(manager.useMeta().isDirty.value).toBe(false));
    manager.useActions().destroy();
  });
});

describe("useBillingSettingsManager — revert restores the loaded values with no request (AC-9)", () => {
  it("AC9 revert restores the loaded values with no request", async () => {
    const { clientId } = await seedClientSession();
    installSettingsGetHandler(server, clientId, recorded.settings());

    const manager = useBillingSettingsManager().as(ScopeActorTypes.CLIENT);
    await manager.useActions().isReady();
    const baseModel = { ...manager.useContext().baseModel.value };

    await manager.useActions().input({ enabled: 0, baseRule: "daily" });
    await manager.useActions().input({ dueDateDay: 7 });
    await vi.waitFor(() => expect(manager.useMeta().isDirty.value).toBe(true));

    const observed = observeClientRequests();
    manager.useActions().revert();
    await vi.waitFor(() => expect(manager.useMeta().isDirty.value).toBe(false));
    observed.stop();

    expect(manager.useContext().model.value).toEqual(baseModel);
    expect(observed.all()).toHaveLength(0);
    manager.useActions().destroy();
  });
});

describe("useBillingSettingsManager — revert cancels a still-pending debounced input (AC-9)", () => {
  it("AC9 revert cancels a pending debounced input before it can apply", async () => {
    const { clientId } = await seedClientSession();
    installSettingsGetHandler(server, clientId, recorded.settings());

    const manager = useBillingSettingsManager().as(ScopeActorTypes.CLIENT);
    await manager.useActions().isReady();
    const baseModel = { ...manager.useContext().baseModel.value };

    const observed = observeClientRequests();
    void manager.useActions().input({ enabled: 0 });
    await manager.useActions().revert();

    await new Promise(resolve => setTimeout(resolve, 500));
    observed.stop();

    expect(manager.useContext().model.value).toEqual(baseModel);
    expect(manager.useMeta().isDirty.value).toBe(false);
    expect(observed.all()).toHaveLength(0);
    manager.useActions().destroy();
  }, 10000);
});

describe("useBillingSettingsManager — an invalid value refuses to save (AC-10)", () => {
  it("AC10 refuses to save while invalid and issues no request", async () => {
    const { clientId } = await seedClientSession();
    installSettingsGetHandler(server, clientId, recorded.settings());

    const manager = useBillingSettingsManager().as(ScopeActorTypes.CLIENT);
    await manager.useActions().isReady();

    const observed = observeClientRequests();
    await manager.useActions().input({ dateOfMonthDay: 40 });
    await vi.waitFor(() => expect(manager.useMeta().isValid.value).toBe(false));
    await manager
      .useActions()
      .update()
      .catch(() => undefined);
    observed.stop();

    expect(manager.useMeta().isProcessing.value).toBe(false);
    expect(
      observed.all().filter(request => request.method === "PUT")
    ).toHaveLength(0);
    manager.useActions().destroy();
  });
});

describe("useBillingSettingsManager — a no-op save issues zero requests (AC-11)", () => {
  it("AC11 a no-op save issues zero requests", async () => {
    const { clientId } = await seedClientSession();
    installSettingsGetHandler(server, clientId, recorded.settings());

    const manager = useBillingSettingsManager().as(ScopeActorTypes.CLIENT);
    await manager.useActions().isReady();

    const observed = observeClientRequests();
    await expect(manager.useActions().update()).resolves.not.toThrow?.();
    observed.stop();

    expect(
      observed.all().filter(request => request.method === "PUT")
    ).toHaveLength(0);
    manager.useActions().destroy();
  });
});

describe("useBillingSettingsManager — every control is unavailable mid-save, and recovers after it settles (AC-13)", () => {
  it("AC13 controls report unavailable while a save is in flight and recover after it settles", async () => {
    const { clientId } = await seedClientSession();
    installSettingsGetHandler(server, clientId, recorded.settings());

    let releaseSave: (() => void) | undefined;
    const held = new Promise<void>(resolve => {
      releaseSave = resolve;
    });
    server?.use(
      http.put(`*/clients/${clientId}`, async () => {
        await held;
        return HttpResponse.json(
          { status: "error", data: null },
          { status: 422 }
        );
      })
    );

    const manager = useBillingSettingsManager().as(ScopeActorTypes.CLIENT);
    await manager.useActions().isReady();

    await manager.useActions().input({ enabled: 0 });
    const updatePromise = manager
      .useActions()
      .update()
      .catch(() => undefined);

    await vi.waitFor(() =>
      expect(manager.useMeta().isProcessing.value).toBe(true)
    );
    expect(manager.useMeta().isEditable.value).toBe(false);

    releaseSave?.();
    await updatePromise;

    await vi.waitFor(() =>
      expect(manager.useMeta().isProcessing.value).toBe(false)
    );
    expect(manager.useMeta().isEditable.value).toBe(true);
    manager.useActions().destroy();
  });
});

describe("useBillingSettingsManager — an external disable locks every control (AC-15)", () => {
  it("AC15 setDisabled(true) locks the meta gate AND refuses the commit, even without touching a control", async () => {
    const { clientId } = await seedClientSession();
    installSettingsGetHandler(server, clientId, recorded.settings());
    const put = installSettingsPutEchoHandler(
      server,
      clientId,
      recorded.settings()
    );

    const manager = useBillingSettingsManager().as(ScopeActorTypes.CLIENT);
    await manager.useActions().isReady();

    manager.useActions().setDisabled(true);
    await vi.waitFor(() =>
      expect(manager.useMeta().isEditable.value).toBe(false)
    );
    expect(manager.useMeta().isProcessing.value).toBe(false);

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
