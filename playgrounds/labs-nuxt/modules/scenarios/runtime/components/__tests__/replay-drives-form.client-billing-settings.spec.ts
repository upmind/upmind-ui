// @vitest-environment happy-dom
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/__tests__/replay-drives-form.client-billing-settings
 * @description A replayed step CHANGES THE FORM ON SCREEN. The world boots the
 * same key and scope the page did, so it ADOPTS the page's own cell; a step
 * that types a recorded value and saves it must move the rendered control —
 * the toggle the operator is looking at — not only a model behind it
 * (operator, 2026-09-12: "the FORM never changes"). Every value is the
 * module's own recording (`put-clients-id-case-enabled-off`), served through
 * the shipped replay handlers.
 */

import { trackedModuleOf } from "../../scenario.utils";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { computed, defineComponent, h } from "vue";
import { ScopeActorTypes } from "@upmind-automation/headless";
import {
  integrationKits,
  integrationSetups
} from "@upmind-automation/headless/testing";
import { reflect, SCOPE_ACTOR } from "@upmind-automation/scenario-harness";
import { InvoiceConsolidationTypes } from "@upmind-automation/types";
import declaration from "../../../useBillingSettingsManager/client-billing-settings.scenario";
import { useModulePort } from "../../composables/useModulePort";
import { useScenarioWorld } from "../../composables/useScenarioWorld";
import {
  armCorpusModule,
  runtimeCorpus,
  runtimeFeature
} from "../../force/corpus";
import { createForceHandlers } from "../../force/handlers";
import { ModuleRenderer } from "../index";
import { filter, find, includes, keys, map } from "lodash-es";
import type { VueWrapper } from "@vue/test-utils";

// -----------------------------------------------------------------------------

const MODULE = trackedModuleOf(declaration.tracks)!;
const ON = "Consolidate invoices";
const OFF = "Do NOT consolidate invoices";

const settle = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));

/** The toggle position the form draws as pressed, by its visible label. */
function pressed(wrapper: VueWrapper<unknown>): string[] {
  const positions = wrapper.findAll(
    '[data-state="on"], [aria-pressed="true"], [aria-checked="true"]'
  );

  return map(positions, position => position.text());
}

// Loaded at the top level, as the forced-surface harness does: the module's
// replay server registers its `beforeAll(listen)` on import, and an import made
// inside a running test registers a hook that never runs — every request then
// leaves for the real API (the seeded refresh token came back "invalid" from
// staging, 2026-09-12).
const kit = (await integrationKits[MODULE]()) as Record<string, unknown>;
const { server } = (await integrationSetups[MODULE]()) as {
  server: {
    use: (...handlers: unknown[]) => void;
    resetHandlers: () => void;
  };
};

await armCorpusModule(MODULE);
const bodies = runtimeCorpus(MODULE)!;
const feature = runtimeFeature(MODULE);

describe("client-billing-settings — a replayed step drives the rendered form", () => {
  it("the world adopts the page's cell, and a saved value moves the toggle on screen", async () => {
    (
      kit[
        find(keys(kit), key => /^reset.*Scopes?$/.test(key)) as string
      ] as () => void
    )();
    server.resetHandlers();
    await (kit.seedClientSession as () => Promise<unknown>)();
    (kit.installBackgroundStubs as (target: unknown) => void)(server);
    server.use(...createForceHandlers("replay", bodies, feature));

    // The PAGE's boot: acting as self, exactly as `ScenarioPlayground` does.
    const port = useModulePort(declaration.useMutate as never, {
      actor: ScopeActorTypes.SELF,
      offeredActors: declaration.actors
    });
    const host = defineComponent({
      setup() {
        const descriptor = computed(() =>
          reflect(declaration.key, SCOPE_ACTOR.SELF, port)
        );
        return () =>
          h(ModuleRenderer, {
            descriptor: descriptor.value,
            port,
            presentation: declaration.presentation
          });
      }
    });
    const wrapper = mount(host, { attachTo: document.body });

    await Promise.race([
      (port.actions.isReady as () => Promise<unknown>)(),
      settle(20000)
    ]);
    await settle();

    expect(pressed(wrapper), "the form did not draw the recorded ON").toEqual([
      ON
    ]);

    // The STEP's boot: the client scope the feature names. Same key, same
    // resolved scope — the world must land on the page's own cell.
    const world = useScenarioWorld();
    await world.boot(declaration.key, { actor: ScopeActorTypes.CLIENT });
    await world.fire("input", { enabled: InvoiceConsolidationTypes.DISABLED });
    await world.fire("update");
    await world.expectContext!({
      model: { enabled: InvoiceConsolidationTypes.DISABLED }
    });
    await settle();

    const shown = pressed(wrapper);

    expect(
      shown,
      "the step saved OFF and the form on screen still shows ON — the world drove a cell the page is not rendering"
    ).toEqual([OFF]);
    expect(filter(shown, label => includes(label, ON))).toEqual([]);

    wrapper.unmount();
  }, 40000);
});
