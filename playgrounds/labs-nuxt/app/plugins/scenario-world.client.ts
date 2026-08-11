import { useScenarioWorld } from "../../modules/scenarios/runtime/composables/useScenarioWorld";
import { SCENARIO_WORLD_KEY } from "../../modules/scenarios/runtime/composables/useScenarioWorld.types";
// -----------------------------------------------------------------------------
/**
 * @module plugins/scenario-world.client
 * @description Publishes the in-page `World` for an out-of-process driver, so
 * the Playwright bridge executes the SAME scenario against the SAME live
 * composables the page renders — one world, two executors.
 *
 * DEV ONLY. Nuxt has no vite `--mode`, so `import.meta.dev` is the gate: the
 * e2e webServer runs `nuxt dev` on its own pinned port, and a production build
 * carries no bridge at all.
 */
// -----------------------------------------------------------------------------

export default defineNuxtPlugin(() => {
  if (!import.meta.dev) return;

  Object.defineProperty(window, SCENARIO_WORLD_KEY, {
    value: useScenarioWorld(),
    configurable: true
  });
});
