import { defineConfig } from "@playwright/test";
import { createBdd, defineBddConfig, test as base } from "playwright-bdd";
import { fixtureSteps } from "./packages/scenario-harness/src/__fixtures__/fixture.steps";
import { NodeWorld } from "./packages/scenario-harness/src/__fixtures__/node-world";
import type {
  StepCatalog,
  StepKind
} from "./packages/scenario-harness/src/steps/steps.types";
import type { World } from "./packages/scenario-harness/src/world/world.types";

// Separate from the root playwright.config.ts (design §4): the e2e lane stays
// untouched, and this lane skips the cart webServer entirely — the only
// shipped `world` today is in-process, so no browser is ever launched here.
const testDir = defineBddConfig({
  features: "packages/scenario-harness/src/__fixtures__/*.feature",
  // The step registrations below live in this same file, so it doubles as
  // its own "steps" module for playwright-bdd's generation pass.
  steps: "playwright.bdd.config.ts",
  outputDir: ".features-gen",
  // Every registered handler forwards a rest-args tuple (StepDef's engine-free
  // shape, design §4), so Function.length is always 0 — the documented case
  // for disabling playwright-bdd's arity check.
  arityCheck: false
});

export const test = base.extend<{ world: World }>({
  // Playwright requires the fixture function's first param to be an
  // object-destructuring pattern, even with no dependency fixtures read.
  // eslint-disable-next-line no-empty-pattern
  world: async ({}, use) => {
    const world = new NodeWorld();

    await use(world);
    await world.dispose();
  }
});

const bdd = createBdd(test, { worldFixture: "world" });

function registrarFor(kind: StepKind) {
  if (kind === "Given") return bdd.Given;
  if (kind === "When") return bdd.When;

  return bdd.Then;
}

/**
 * Walks an engine-free {@link StepCatalog} (design §4), re-registering each
 * `StepDef` with playwright-bdd's real `Given`/`When`/`Then` over the `world`
 * fixture above — the catalog itself never imports playwright-bdd.
 */
function registerCatalog(catalog: StepCatalog): void {
  for (const step of catalog.steps) {
    registrarFor(step.kind)(step.pattern, function (this: World, ...args) {
      return step.handler(this, ...args);
    });
  }
}

registerCatalog(fixtureSteps);

export default defineConfig({
  testDir,
  reporter: "list"
});
