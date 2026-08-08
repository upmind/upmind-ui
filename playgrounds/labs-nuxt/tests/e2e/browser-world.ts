// -----------------------------------------------------------------------------
/**
 * @module tests/e2e/browser-world
 * @description The BRIDGE `World` — the same seam the in-page world
 * implements, driven out of process. Every member round-trips to the browser
 * and calls the in-page world the app published, so a `.feature` executes
 * against the real composables rather than a second, e2e-only model of them.
 *
 * It asserts nothing itself: the in-page world raises, and `page.evaluate`
 * carries that rejection back here as the step's failure.
 */

import { SCENARIO_WORLD_KEY } from "../../app/composables/factory/useScenarioWorld.types";
import type { Page } from "@playwright/test";
import type { ScenarioKey } from "@upmind-automation/headless/scenarios";
import type { World, WorldScope } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/** One in-page world call, by member name, with its already-plain arguments. */
async function call(
  page: Page,
  member: keyof World,
  args: unknown[] = []
): Promise<void> {
  await page.evaluate(
    async ([key, name, callArgs]) => {
      const world = (window as unknown as Record<string, unknown>)[
        key as string
      ] as Record<string, (...rest: unknown[]) => Promise<void>> | undefined;

      if (!world)
        throw new Error(
          `browser world: the page published no "${key}" — is the app running in dev mode?`
        );

      await world[name as string](...(callArgs as unknown[]));
    },
    [SCENARIO_WORLD_KEY, member, args] as const
  );
}

/**
 * Builds the bridge world over one Playwright page.
 *
 * @param page The page the scenario drives; it must already be on a route that
 * has booted the app, since the world lives in the app's own runtime.
 */
export function createBrowserWorld(page: Page): World<ScenarioKey> {
  return {
    boot: (key, scope: WorldScope) => call(page, "boot", [key, scope]),
    fire: (actionId, input) => call(page, "fire", [actionId, input]),
    expectMeta: expected => call(page, "expectMeta", [expected]),
    expectContext: expected => call(page, "expectContext", [expected]),
    dispose: () => call(page, "dispose")
  };
}
