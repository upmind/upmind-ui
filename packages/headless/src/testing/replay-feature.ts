// -----------------------------------------------------------------------------
/**
 * @module testing/replay-feature
 * @description The module-level REPLAY: a module's own `.feature` run scenario
 * by scenario, through that module's own step catalog, against its REAL
 * composables and its OWN recorded corpus — inside the headless integration
 * lane, before any page exists.
 *
 * The parse and the match are the HARNESS's own — `parseFeatureScenarios` and
 * `createStepMatcher`, the two functions both `createTraceabilityCheck` and the
 * playground's `useFeatureTracks` run — so a step that traces in the
 * traceability gate plays here, and there is no second parser, no second
 * catalog and no second copy of the scenario logic.
 *
 * What this catches that traceability cannot: traceability grades step TEXT
 * against catalog PATTERNS, so a handler naming a flag the module does not
 * publish (`hasError` where a manager publishes `hasErrors`) or firing an
 * action id it does not own (`refresh` where a manager re-reads through
 * `reset`) traces perfectly and has never once been RUN. Both landed in
 * `client-billing-settings.steps.ts` undetected (2026-09-12). Replayed, each is
 * red on the first scenario that reaches it.
 *
 * Deliberately NOT re-exported from `./testing`: this file names `vitest`, and
 * that entry is the one the app-runtime seam still reaches (FE-3133). A
 * module's own `*.replay.int.test.ts` names this file by path, which never
 * leaves the package.
 */

import { describe, it } from "vitest";
import {
  createStepMatcher,
  parseFeatureScenarios
} from "@upmind-automation/scenario-harness";
import { createNodeWorld } from "./node-world";
import {
  drop,
  filter,
  forEach,
  includes,
  isEmpty,
  join,
  reject,
  some
} from "lodash-es";
import type { NodeComposable, NodeWorldJourneys } from "./node-world";
import type {
  FeatureScenario,
  StepCatalog,
  StepMatcher,
  World
} from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/** A scenario carrying this tag is written down and deliberately not driven yet. */
const TODO_TAG = "@todo";

/** The AC tag a scenario's own title carries into the replay's test name. */
const AC_TAG = /^@AC-\d+$/;

/** What a module hands `replayFeature` — its own feature, catalog, modules and corpus. */
export type ReplayFeatureSource<K extends string> = {
  /** The module that owns the feature — the `describe` block's subject. */
  moduleName: string;
  /** The module's own `.feature` TEXT, read from the co-located file. */
  feature: string;
  /** The module's own ONE step catalog — the file's default export, never a copy. */
  catalog: StepCatalog;
  /** Scenario key -> the composable that key boots. */
  composables: Record<K, NodeComposable>;
  /** The recorded arrangements a `Given` may seed a boot with. */
  journeys?: NodeWorldJourneys;
  /** The module's integration-kit arrangement, run before each scenario's first step. */
  arrange?: () => Promise<void> | void;
  /** Run after every scenario, passed or failed — the kit's own scope reset. */
  cleanup?: () => Promise<void> | void;
  /** Per-scenario timeout; absent, the runner's own. */
  timeoutMs?: number;
};

// -----------------------------------------------------------------------------

/**
 * The test name one scenario takes: its own `@AC-<n>` tags first, then its
 * title verbatim. The tags are in the name so a red reads as the ACCEPTANCE
 * CRITERION that broke rather than a sentence somebody has to go and look up.
 */
function scenarioTitle(scenario: FeatureScenario): string {
  const acTags = filter(scenario.tags, tag => AC_TAG.test(tag));

  return isEmpty(acTags)
    ? scenario.name
    : `${join(acTags, " ")} ${scenario.name}`;
}

/**
 * Whether the catalog drives this scenario at all — at least one of its OWN
 * steps matches, the Background's excluded. `useFeatureTracks`'s own rule, for
 * its own reason: a Background every sibling shares can never make an un-
 * stepped scenario look driveable.
 */
function isDriven(scenario: FeatureScenario, matcher: StepMatcher): boolean {
  return some(
    drop(scenario.steps, scenario.backgroundStepCount),
    step => !!matcher.match(step.text)
  );
}

/**
 * Runs one scenario's steps in order — Background first — against a world of
 * its own. An unmatched step REFUSES rather than being skipped to keep the
 * scenario moving: a replay that steps over what it cannot run lies about what
 * the module did.
 */
async function runScenario(
  scenario: FeatureScenario,
  matcher: StepMatcher,
  world: World
): Promise<void> {
  for (const step of scenario.steps) {
    const matched = matcher.match(step.text);

    if (!matched)
      throw new Error(
        `replay-feature: no step matches "${step.kind} ${step.text}" (line ${step.line})`
      );

    try {
      await matched.def.handler(world, ...matched.args);
    } catch (error) {
      // Re-thrown carrying the step that failed: a world error names the flag
      // or the action, and this names the line of the feature that asked for
      // it — together they are the whole diagnosis.
      throw new Error(
        `replay-feature: "${step.kind} ${step.text}" (line ${step.line}) failed — ${error instanceof Error ? error.message : String(error)}`,
        { cause: error }
      );
    }
  }
}

// -----------------------------------------------------------------------------

/**
 * Registers one vitest test per non-`@todo` scenario of `source.feature`, each
 * replaying that scenario's steps through `source.catalog` against a FRESH
 * world over `source.composables`.
 *
 * Test names are built from the feature, so they are dynamic: the module's own
 * traceability gate regex-scans literal `describe`/`it` titles and will not
 * count these, which is correct — this file proves the scenarios RUN, and the
 * AC<->spec link stays that gate's job.
 */
export function replayFeature<K extends string>(
  source: ReplayFeatureSource<K>
): void {
  const matcher = createStepMatcher(source.catalog);

  describe(`${source.moduleName} — the co-located feature, replayed through the module's own steps`, () => {
    // A pattern that fails to COMPILE leaves its steps unmatched, which would
    // read as "not driven yet" and skip in silence. Said out loud instead.
    forEach(matcher.malformedStepDefs, ({ pattern, message }) => {
      it(`a catalog pattern does not compile: ${pattern}`, () => {
        throw new Error(`replay-feature: ${pattern} — ${message}`);
      });
    });

    const scenarios = reject(
      parseFeatureScenarios(source.feature),
      ({ tags }) => includes(tags, TODO_TAG)
    );

    forEach(scenarios, scenario => {
      const title = scenarioTitle(scenario);

      // Driven by none of its own steps — a capability written down and not yet
      // driven, which is a legitimate state the traceability gate already
      // grades. Skipped VISIBLY, with the reason in the name.
      if (!isDriven(scenario, matcher)) {
        it.skip(`${title} — no step in the catalog drives it`, () => undefined);
        return;
      }

      it(
        title,
        async () => {
          const world = createNodeWorld({
            composables: source.composables,
            journeys: source.journeys
          });

          await source.arrange?.();

          try {
            await runScenario(scenario, matcher, world);
          } finally {
            // Both always, even on a red: a live instance left in the scope
            // registry is the next scenario's silent adoption.
            await world.dispose();
            await source.cleanup?.();
          }
        },
        source.timeoutMs
      );
    });
  });
}
