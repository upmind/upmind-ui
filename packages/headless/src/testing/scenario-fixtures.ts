// -----------------------------------------------------------------------------
/**
 * @module testing/scenario-fixtures
 * @description Where ONE scenario step's fixtures live (FE-3145). A module
 * scenario is a unit on the journey rails — one self-contained folder keyed by
 * its `.feature` title — with its fixtures grouped by the step that made the
 * requests:
 *
 *   `<module>/__tests__/scenarios/<scenario-slug>/<NN>/`
 *
 * `NN` is the step's 1-based place in the scenario, the Background's steps
 * first — the order replay plays them in. EVERY step has its folder, so a
 * scenario's folders read one for one as its steps do; a step that makes no
 * request holds only a `.gitkeep`. The generator writes these folders and the
 * replay reads them, and both name them through this file only, so the two can
 * never disagree.
 */

import {
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { basename, join } from "node:path";
import { parseFeatureScenarios } from "@upmind-automation/scenario-harness";
import { scenarioSlug, stepKey } from "./fixtures";
import { difference, find, findIndex, forEach, map } from "lodash-es";
import type { FeatureScenario } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/** A scenario's own folder, keyed by its title. */
export function scenarioDir(testsDir: string, scenario: string): string {
  return join(testsDir, "scenarios", scenarioSlug(scenario));
}

/**
 * The fixtures folder of the step at `index` (0-based) in `scenario`.
 *
 * @param testsDir The module's `__tests__` directory.
 * @param scenario The parsed scenario, Background steps included.
 * @param index The step's 0-based place in `scenario.steps`.
 */
export function stepFixturesDir(
  testsDir: string,
  scenario: FeatureScenario,
  index: number
): string {
  return join(scenarioDir(testsDir, scenario.name), stepKey(index));
}

/** Every step's folder in `scenario`, in step order. */
function stepFixturesDirs(
  testsDir: string,
  scenario: FeatureScenario
): string[] {
  return map(scenario.steps, (_step, index) =>
    stepFixturesDir(testsDir, scenario, index)
  );
}

/** The scenario titled `scenario` in `feature`, or a refusal naming it. */
function scenarioNamed(feature: string, scenario: string): FeatureScenario {
  const parsed = find(parseFeatureScenarios(feature), ["name", scenario]);

  if (!parsed)
    throw new Error(`scenario-fixtures: the feature declares no "${scenario}"`);

  return parsed;
}

/**
 * Empties the scenario's folder and lays out one folder per step, each with a
 * `.gitkeep` — what the generator does once before it records the scenario,
 * so no answer from an earlier recording survives and a step that makes no
 * request still has its folder.
 *
 * @param testsDir The module's `__tests__` directory.
 * @param feature The module's `.feature` text.
 * @param scenario The scenario's title, verbatim.
 */
export function prepareScenarioDirs(
  testsDir: string,
  feature: string,
  scenario: string
): void {
  const parsed = scenarioNamed(feature, scenario);

  rmSync(scenarioDir(testsDir, scenario), { recursive: true, force: true });
  forEach(stepFixturesDirs(testsDir, parsed), dir => {
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, ".gitkeep"), "");
  });
}

/**
 * How a recorded scenario's folders differ from its steps: the step folders it
 * lacks and the folders no step names. Both empty means the recording reads
 * one for one as the `.feature` does.
 *
 * @param testsDir The module's `__tests__` directory.
 * @param scenario The parsed scenario, Background steps included.
 */
export function stepDirDrift(
  testsDir: string,
  scenario: FeatureScenario
): { missing: string[]; extra: string[] } {
  const dir = scenarioDir(testsDir, scenario.name);
  const expected = map(stepFixturesDirs(testsDir, scenario), stepDir =>
    basename(stepDir)
  );
  const present = existsSync(dir) ? readdirSync(dir) : [];

  return {
    missing: difference(expected, present),
    extra: difference(present, expected)
  };
}

/**
 * The fixtures folder of the step whose text is `step` in the scenario titled
 * `scenario` — how the generator names the folder it records into, by the
 * same words the `.feature` uses. Throws when the `.feature` holds no such
 * scenario or step: a recording for a step the feature does not declare is a
 * recording of nothing.
 *
 * @param testsDir The module's `__tests__` directory.
 * @param feature The module's `.feature` text.
 * @param scenario The scenario's title, verbatim.
 * @param step The step's text, verbatim, without its keyword.
 */
export function recordedStepDir(
  testsDir: string,
  feature: string,
  scenario: string,
  step: string
): string {
  const parsed = scenarioNamed(feature, scenario);
  const index = findIndex(parsed.steps, ["text", step]);

  if (index < 0)
    throw new Error(
      `scenario-fixtures: the feature declares no step "${step}" in "${scenario}"`
    );

  return stepFixturesDir(testsDir, parsed, index);
}
