import { defineConfig } from "@playwright/test";
import { createBdd, defineBddConfig, test as base } from "playwright-bdd";
import { STEP_KIND } from "@upmind-automation/scenario-harness";
// The `__fixtures__` trio stays on a path: it is the harness's own exemplar
// corpus, which `fixture-registry.ts` declares is never exported from the
// barrel — so there is no specifier to reach it by.
import { fixtureRegistry } from "./packages/scenario-harness/src/__fixtures__/fixture-registry";
import { fixtureSteps } from "./packages/scenario-harness/src/__fixtures__/fixture.steps";
import { NodeWorld } from "./packages/scenario-harness/src/__fixtures__/node-world";
import type { FixtureKey } from "./packages/scenario-harness/src/__fixtures__/fixture-registry";
import type {
  StepCatalog,
  StepKind,
  World
} from "@upmind-automation/scenario-harness";

// Separate from the root playwright.config.ts: the e2e lane stays untouched,
// and this lane skips the cart webServer entirely — the only shipped `world`
// today is in-process, so no browser is ever launched here.
const testDir = defineBddConfig({
  features: [
    "packages/scenario-harness/src/__fixtures__/*.feature",
    // ADR-020 Amendment 4's third, package-source-colocated home for a
    // single module's own feature (living beside its `.steps.ts`, mirroring
    // headless's module layout) — added so a landed FE-2968 pair is
    // executed (or errors as unmatched) rather than silently never run.
    // Scoped to scenario-harness ONLY: headless module features are the
    // PLAYGROUND's playlist (ADR-020 Amendment 5) — their catalogs run in
    // the labs replay world, and their not-yet-driveable scenarios are a
    // legitimate state this node lane must not fail as missing steps.
    "packages/scenario-harness/src/modules/**/*.feature"
  ],
  // The step registrations below live in this same file, so it doubles as
  // its own "steps" module for playwright-bdd's generation pass.
  steps: "playwright.bdd.config.ts",
  outputDir: ".features-gen",
  // Every registered handler forwards a rest-args tuple (StepDef's
  // engine-free shape), so Function.length is always 0 — the documented case
  // for disabling playwright-bdd's arity check. Trade-off, stated plainly:
  // this removes the only check that a step handler actually consumes its
  // pattern's captures (playwright-bdd's cucumber-style arity rule would
  // otherwise fail generation on a dropped `{int}`/`{string}` argument), and
  // nothing in this harness replaces it — `createTraceabilityCheck` only
  // pattern-matches step TEXT, never arity. An unread capture is a real,
  // uncaught gap in this lane today.
  arityCheck: false
});

export const test = base.extend<{ world: World<FixtureKey> }>({
  // Playwright requires the fixture function's first param to be an
  // object-destructuring pattern, even with no dependency fixtures read.
  // eslint-disable-next-line no-empty-pattern
  world: async ({}, use) => {
    const world = new NodeWorld(fixtureRegistry);

    await use(world);
    await world.dispose();
  }
});

const bdd = createBdd(test, { worldFixture: "world" });

function registrarFor(kind: StepKind) {
  if (kind === STEP_KIND.GIVEN) return bdd.Given;
  if (kind === STEP_KIND.WHEN) return bdd.When;

  return bdd.Then;
}

/**
 * Walks an engine-free {@link StepCatalog}, re-registering each `StepDef`
 * with playwright-bdd's real `Given`/`When`/`Then` over the `world` fixture
 * above — the catalog itself never imports playwright-bdd.
 *
 * Provenance limitation: playwright-bdd records a step definition's location
 * from a fixed call-stack offset (the direct caller of `Given`/`When`/`Then`),
 * which for every step registered through this loop is this same call site —
 * never the owning `.steps.ts`. A pattern clash or a missing-step/arity error
 * therefore names `playwright.bdd.config.ts` for every catalog, and a future
 * catalog authored under a tag-scoped path (playwright-bdd's `@tag/*.steps.ts`
 * convention) loses its path-derived tag scope. Benign today (one catalog, no
 * `@`-prefixed path) but the registration pattern FE-2968 modules copy.
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
