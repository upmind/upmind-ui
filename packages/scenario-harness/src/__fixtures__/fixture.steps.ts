import {
  COMPOSABLE_KEY,
  defineSteps
} from "@upmind-automation/scenario-harness";
import type { World } from "@upmind-automation/scenario-harness";

/**
 * The @AC-5 exemplar's step definitions — engine-free: the only
 * import surface is `{ defineSteps, World, COMPOSABLE_KEY }`, and every body
 * speaks solely through `world`. Playwright-bdd registers these patterns
 * itself (root `playwright.bdd.config.ts`); nothing here knows an engine
 * exists.
 */
export const fixtureSteps = defineSteps(({ Given, When, Then }) => {
  Given("a fresh fixture switch", async (world: World) => {
    await world.boot(COMPOSABLE_KEY.AUTH, { actor: "self" });
  });

  Given("a fixture switch that is on", async world => {
    await world.boot(COMPOSABLE_KEY.AUTH, { actor: "self" });
    await world.fire("turnOn");
  });

  When("the switch is turned on", async world => {
    await world.fire("turnOn");
  });

  When("the switch is turned off", async world => {
    await world.fire("turnOff");
  });

  When("the switch is labelled {string}", async (world, label) => {
    await world.fire("rename", { label });
  });

  Then("the switch reports itself as on", async world => {
    await world.expectMeta({ isOn: true });
  });

  Then("the switch reports itself as off", async world => {
    await world.expectMeta({ isOn: false });
  });

  Then("the switch reports a label is set", async world => {
    await world.expectMeta({ hasLabel: true });
  });
});
