// -----------------------------------------------------------------------------
/**
 * @fileoverview client-billing-settings write half — every legacy state
 * reaching the wire, and the per-field diff (AC-3, AC-18, AC-4, AC-5, AC-6,
 * AC-7, AC-12)
 *
 * ## Job To Be Done
 * Drive the REAL `useBillingSettingsManager()` THROUGH THE BARREL against
 * MSW-replayed staging recordings and prove: every legacy `enabled` state
 * reaches the outbound `PUT clients/{id}` body as its exact legacy token —
 * `1`, `0`, `2` (AC-3) — and that the `DISABLED` (`0`) case survives as a
 * literal, present key rather than being compacted away as a falsy leaf
 * (AC-18, hazard H5, the run's most likely correctness defect); each of the
 * four nullable cadence fields reaches the wire as its chosen value on set
 * and an EXPLICIT `null` on clear (AC-4, AC-5, AC-6, AC-7), and the two
 * range-bound fields refuse an out-of-domain value before any request is
 * issued; and a save carries ONLY the changed keys, addressed through the
 * SAME identity seam the read uses, after which the shared cache
 * invalidates so a subsequent read reflects the change (AC-12).
 *
 * Every outbound body assertion is on the REQUEST, never the response —
 * asserting the model alone would pass while the wire body was still wrong
 * (design.md §10). Every `input()` is followed by a `vi.waitFor` on the
 * model before the next `update()` — a fill-then-save with no settle wait
 * sends the STALE model (the debounced-input race the house rules warn
 * against; see `code-tests-e2e.md` §"Assert the whole mutation chain").
 *
 * Each seeded baseline is chosen so the value under test actually DIFFERS
 * from what is loaded — this module's real recorded baseline already holds
 * `invoice_consolidation_enabled: 1`, so a case setting it back to `1` would
 * be a no-op diff, not a proof of anything.
 *
 * ## What Breaks If These Fail
 * A client's off-switch that does nothing (AC-18's hazard, silently green);
 * a cleared cadence field that is never actually cleared on the wire; or a
 * save that writes untouched fields and collides with a sibling module's own
 * write to the same record (parity row X1).
 */

import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
// Primed by import order (not mocked): see client-billing-settings.read.int.test.ts's
// top-of-file note — the real session-store must resolve before this
// module's own barrel, or the transitive `../scope` walk re-enters itself
// mid-evaluation.
import { useBillingSettings, useBillingSettingsManager } from "..";
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

describe("useBillingSettingsManager — every enabled state reaches the wire as its legacy token (AC-3)", () => {
  it.each([
    { label: "ENABLED", value: 1, seed: recorded.enabledOff },
    { label: "DISABLED", value: 0, seed: recorded.enabledOn },
    { label: "INHERIT", value: 2, seed: recorded.settings }
  ])(
    "AC3 each consolidation state reaches the wire as its legacy token — $label",
    async ({ value, seed }) => {
      const { clientId } = await seedClientSession();
      installSettingsGetHandler(server, clientId, seed());
      const put = installSettingsPutEchoHandler(server, clientId, seed());

      const manager = useBillingSettingsManager().as(ScopeActorTypes.CLIENT);
      await manager.useActions().isReady();

      await manager.useActions().input({ enabled: value });
      await vi.waitFor(() =>
        expect(manager.useContext().model.value.enabled).toBe(value)
      );
      await manager.useActions().update();

      expect(put.bodies()).toHaveLength(1);
      expect(put.bodies()[0]).toHaveProperty(
        "invoice_consolidation_enabled",
        value
      );
      manager.useActions().destroy();
    }
  );
});

describe("useBillingSettingsManager — DISABLED survives as a literal zero (AC-18)", () => {
  it("AC18 DISABLED writes a literal zero to the outbound PUT body", async () => {
    const { clientId } = await seedClientSession();
    // Seeded already ENABLED (row X3's hazard is specifically the ON -> OFF
    // transition compacting the falsy leaf away).
    installSettingsGetHandler(server, clientId, recorded.enabledOn());
    const put = installSettingsPutEchoHandler(
      server,
      clientId,
      recorded.enabledOn()
    );

    const manager = useBillingSettingsManager().as(ScopeActorTypes.CLIENT);
    await manager.useActions().isReady();
    expect(manager.useContext().baseModel.value.enabled).toBe(1);

    await manager.useActions().input({ enabled: 0 });
    await vi.waitFor(() =>
      expect(manager.useContext().model.value.enabled).toBe(0)
    );
    await manager.useActions().update();

    expect(put.bodies()).toHaveLength(1);
    expect(put.bodies()[0]).toHaveProperty("invoice_consolidation_enabled", 0);
    manager.useActions().destroy();
  });
});

describe("useBillingSettingsManager — the base rule sets and clears to an explicit null (AC-4)", () => {
  it("AC4 base rule sets to a legacy token on the wire", async () => {
    const { clientId } = await seedClientSession();
    installSettingsGetHandler(server, clientId, recorded.settings());
    const put = installSettingsPutEchoHandler(
      server,
      clientId,
      recorded.settings()
    );

    const manager = useBillingSettingsManager().as(ScopeActorTypes.CLIENT);
    await manager.useActions().isReady();

    await manager.useActions().input({ baseRule: "day_of_week" });
    await vi.waitFor(() =>
      expect(manager.useContext().model.value.baseRule).toBe("day_of_week")
    );
    await manager.useActions().update();
    expect(put.bodies()[0]).toHaveProperty(
      "invoice_consolidation_base_rule",
      "day_of_week"
    );
    manager.useActions().destroy();
  });

  it("AC4 base rule clears to an explicit null on the wire", async () => {
    const { clientId } = await seedClientSession();
    // Seeded ALREADY carrying a base rule, so clearing it is unambiguously a
    // real diff against the loaded baseline — never chained after a prior
    // save in the SAME test, which conflates this AC with whether a save
    // refreshes the manager's own baseline (a separate, undocumented question).
    installSettingsGetHandler(server, clientId, recorded.baseRuleSet());
    const put = installSettingsPutEchoHandler(
      server,
      clientId,
      recorded.baseRuleClear()
    );

    const manager = useBillingSettingsManager().as(ScopeActorTypes.CLIENT);
    await manager.useActions().isReady();
    expect(manager.useContext().baseModel.value.baseRule).toBe("day_of_week");

    await manager.useActions().input({ baseRule: null });
    await vi.waitFor(() =>
      expect(manager.useContext().model.value.baseRule).toBe(null)
    );
    await manager.useActions().update();
    expect(put.bodies()[0]).toHaveProperty(
      "invoice_consolidation_base_rule",
      null
    );
    manager.useActions().destroy();
  });
});

describe("useBillingSettingsManager — the weekly day sets and clears to an explicit null (AC-5)", () => {
  it("AC5 day of week sets to a legacy token on the wire", async () => {
    const { clientId } = await seedClientSession();
    installSettingsGetHandler(server, clientId, recorded.settings());
    const put = installSettingsPutEchoHandler(
      server,
      clientId,
      recorded.settings()
    );

    const manager = useBillingSettingsManager().as(ScopeActorTypes.CLIENT);
    await manager.useActions().isReady();

    await manager.useActions().input({ dayOfWeek: "monday" });
    await vi.waitFor(() =>
      expect(manager.useContext().model.value.dayOfWeek).toBe("monday")
    );
    await manager.useActions().update();
    expect(put.bodies()[0]).toHaveProperty(
      "invoice_consolidation_base_rule_day_of_week",
      "monday"
    );
    manager.useActions().destroy();
  });

  it("AC5 day of week clears to an explicit null on the wire", async () => {
    const { clientId } = await seedClientSession();
    installSettingsGetHandler(server, clientId, recorded.dayOfWeekSet());
    const put = installSettingsPutEchoHandler(
      server,
      clientId,
      recorded.dayOfWeekClear()
    );

    const manager = useBillingSettingsManager().as(ScopeActorTypes.CLIENT);
    await manager.useActions().isReady();
    expect(manager.useContext().baseModel.value.dayOfWeek).toBe("monday");

    await manager.useActions().input({ dayOfWeek: null });
    await vi.waitFor(() =>
      expect(manager.useContext().model.value.dayOfWeek).toBe(null)
    );
    await manager.useActions().update();
    expect(put.bodies()[0]).toHaveProperty(
      "invoice_consolidation_base_rule_day_of_week",
      null
    );
    manager.useActions().destroy();
  });
});

describe("useBillingSettingsManager — the monthly day accepts 1-31, clears to null, and refuses out-of-range (AC-6)", () => {
  it("AC6 day of month accepts a value in 1-31 on the wire", async () => {
    const { clientId } = await seedClientSession();
    installSettingsGetHandler(server, clientId, recorded.settings());
    const put = installSettingsPutEchoHandler(
      server,
      clientId,
      recorded.settings()
    );

    const manager = useBillingSettingsManager().as(ScopeActorTypes.CLIENT);
    await manager.useActions().isReady();

    await manager.useActions().input({ dateOfMonthDay: 15 });
    await vi.waitFor(() =>
      expect(manager.useContext().model.value.dateOfMonthDay).toBe(15)
    );
    await manager.useActions().update();
    expect(put.bodies()[0]).toHaveProperty(
      "invoice_consolidation_base_rule_date_of_month_day",
      15
    );
    manager.useActions().destroy();
  });

  it("AC6 day of month clears to an explicit null on the wire", async () => {
    const { clientId } = await seedClientSession();
    installSettingsGetHandler(server, clientId, recorded.dayOfMonthSet());
    const put = installSettingsPutEchoHandler(
      server,
      clientId,
      recorded.dayOfMonthClear()
    );

    const manager = useBillingSettingsManager().as(ScopeActorTypes.CLIENT);
    await manager.useActions().isReady();
    expect(manager.useContext().baseModel.value.dateOfMonthDay).toBe(15);

    await manager.useActions().input({ dateOfMonthDay: null });
    await vi.waitFor(() =>
      expect(manager.useContext().model.value.dateOfMonthDay).toBe(null)
    );
    await manager.useActions().update();
    expect(put.bodies()[0]).toHaveProperty(
      "invoice_consolidation_base_rule_date_of_month_day",
      null
    );
    manager.useActions().destroy();
  });

  it("AC6 refuses a day of month outside 1-31 before any request is issued", async () => {
    const { clientId } = await seedClientSession();
    installSettingsGetHandler(server, clientId, recorded.settings());
    const put = installSettingsPutEchoHandler(
      server,
      clientId,
      recorded.settings()
    );

    const manager = useBillingSettingsManager().as(ScopeActorTypes.CLIENT);
    await manager.useActions().isReady();

    const observed = observeClientRequests();
    await manager.useActions().input({ dateOfMonthDay: 32 });
    await vi.waitFor(() => expect(manager.useMeta().isValid.value).toBe(false));
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

describe("useBillingSettingsManager — the due-date day accepts 1-28, clears to null, and refuses out-of-range (AC-7)", () => {
  it("AC7 due date day accepts a value in 1-28 on the wire", async () => {
    const { clientId } = await seedClientSession();
    installSettingsGetHandler(server, clientId, recorded.settings());
    const put = installSettingsPutEchoHandler(
      server,
      clientId,
      recorded.settings()
    );

    const manager = useBillingSettingsManager().as(ScopeActorTypes.CLIENT);
    await manager.useActions().isReady();

    await manager.useActions().input({ dueDateDay: 7 });
    await vi.waitFor(() =>
      expect(manager.useContext().model.value.dueDateDay).toBe(7)
    );
    await manager.useActions().update();
    expect(put.bodies()[0]).toHaveProperty(
      "invoice_consolidation_due_date_day",
      7
    );
    manager.useActions().destroy();
  });

  it("AC7 due date day clears to an explicit null on the wire", async () => {
    const { clientId } = await seedClientSession();
    installSettingsGetHandler(server, clientId, recorded.dueDateDaySet());
    const put = installSettingsPutEchoHandler(
      server,
      clientId,
      recorded.dueDateDayClear()
    );

    const manager = useBillingSettingsManager().as(ScopeActorTypes.CLIENT);
    await manager.useActions().isReady();
    expect(manager.useContext().baseModel.value.dueDateDay).toBe(7);

    await manager.useActions().input({ dueDateDay: null });
    await vi.waitFor(() =>
      expect(manager.useContext().model.value.dueDateDay).toBe(null)
    );
    await manager.useActions().update();
    expect(put.bodies()[0]).toHaveProperty(
      "invoice_consolidation_due_date_day",
      null
    );
    manager.useActions().destroy();
  });

  it("AC7 refuses a due date day outside 1-28 before any request is issued", async () => {
    const { clientId } = await seedClientSession();
    installSettingsGetHandler(server, clientId, recorded.settings());
    const put = installSettingsPutEchoHandler(
      server,
      clientId,
      recorded.settings()
    );

    const manager = useBillingSettingsManager().as(ScopeActorTypes.CLIENT);
    await manager.useActions().isReady();

    const observed = observeClientRequests();
    await manager.useActions().input({ dueDateDay: 29 });
    await vi.waitFor(() => expect(manager.useMeta().isValid.value).toBe(false));
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

describe("useBillingSettingsManager — a save carries only the changed keys, through the read's own seam, and refreshes every reader (AC-12)", () => {
  it("AC12 saves a per-field diff to PUT clients/{id} through the same identity seam", async () => {
    const { clientId, accessToken } = await seedClientSession();
    // Seeded OFF/no-rule so BOTH fields under test genuinely differ from the
    // loaded baseline — the real recorded baseline already holds `enabled: 1`
    // and `baseRule: null`, so setting `{enabled: 1}` alone would be a no-op.
    installSettingsGetHandler(server, clientId, recorded.enabledOff());
    const put = installSettingsPutEchoHandler(
      server,
      clientId,
      recorded.diffOnly()
    );

    const manager = useBillingSettingsManager().as(ScopeActorTypes.CLIENT);
    await manager.useActions().isReady();

    const observed = observeClientRequests();
    await manager.useActions().input({ enabled: 1, baseRule: "daily" });
    await vi.waitFor(() => {
      expect(manager.useContext().model.value.enabled).toBe(1);
      expect(manager.useContext().model.value.baseRule).toBe("daily");
    });
    await manager.useActions().update();
    observed.stop();

    const writes = observed.all().filter(request => request.method === "PUT");
    expect(writes).toHaveLength(1);
    expect(writes[0].url).toContain(`/clients/${clientId}`);
    expect(
      writes[0].headers.authorization ?? writes[0].headers.Authorization
    ).toBe(`Bearer ${accessToken}`);

    expect(Object.keys(put.bodies()[0]).sort()).toEqual(
      [
        "invoice_consolidation_base_rule",
        "invoice_consolidation_enabled"
      ].sort()
    );

    server?.use(
      http.get(`*/clients/${clientId}`, () =>
        HttpResponse.json(recorded.diffOnly(), { status: 200 })
      )
    );
    const reader = useBillingSettings().as(ScopeActorTypes.CLIENT);
    await reader.useActions().refresh();
    await reader.useActions().isReady();
    expect(reader.useContext().data.value.enabled).toBe(
      recorded.diffOnly().data.invoice_consolidation_enabled
    );

    manager.useActions().destroy();
  });
});
