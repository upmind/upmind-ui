/**
 * @graphify-citation `graphify query "gherkin feature scenario parse step
 * matcher compiled args"` (2026-08-11) and `graphify query "duplicated step
 * pattern across catalogs"` (2026-08-12) — no `FeatureScenario` / `StepMatch` /
 * `StepMatcher` / `Duplicat*` node in `graphify-out/graph.json`, and the only
 * feature-parse and step-match code in the tree is this package's own
 * `traceability.ts` private helpers, which these types name as they become
 * public. No duplicate to consume, so minting here is warranted.
 */
import type { World } from "../world/world.types";

/** Gherkin's exact wire strings for the three step kinds. */
export const STEP_KIND = {
  GIVEN: "Given",
  WHEN: "When",
  THEN: "Then"
} as const;

export type StepKind = (typeof STEP_KIND)[keyof typeof STEP_KIND];

export type StepHandler = (
  world: World,
  ...args: ReadonlyArray<string | number>
) => void | Promise<void>;

export type StepDef = {
  kind: StepKind;
  pattern: string; // cucumber-expression source — data, matched executor-side
  handler: StepHandler;
};

export type StepCatalog = {
  steps: ReadonlyArray<StepDef>;
};

/**
 * Every module's step catalog, keyed by module name — the shape headless's
 * published test entry collects by convention, and the third argument
 * `createTraceabilityCheck` reads to make a cross-catalog pattern collision
 * visible.
 */
export type StepCatalogs = Readonly<Record<string, StepCatalog>>;

export type FeatureStep = {
  readonly kind: StepKind;
  readonly text: string;
  readonly line: number;
};

/**
 * One playable scenario of a parsed feature: its own name, its own `@`-prefixed
 * tags (feature- and rule-level tags are not inherited), the line it is
 * declared on, and its steps in run order — the enclosing Background's steps
 * first, then the scenario's own. A Scenario Outline is already expanded into
 * one of these per Examples row, taking its name, steps and line from that row.
 *
 * `backgroundStepCount` is how many leading `steps` entries came from an
 * enclosing Background — the split that lets a reader tell the scenario's OWN
 * steps from the ones every sibling shares, which is what driveability grades.
 */
export type FeatureScenario = {
  readonly name: string;
  readonly tags: readonly string[];
  readonly line: number;
  readonly steps: readonly FeatureStep[];
  readonly backgroundStepCount: number;
};

/**
 * A catalog `StepDef` whose `pattern` failed to compile as a cucumber
 * expression (e.g. an unregistered custom parameter type, unbalanced
 * optional-text) — surfaced as data instead of throwing out of
 * `createTraceabilityCheck`.
 */
export type MalformedStepDef = {
  readonly pattern: string;
  readonly message: string;
};

/**
 * A pattern the checked catalog shares with at least one OTHER catalog in the
 * {@link StepCatalogs} map, naming the modules that also claim it. Two catalogs
 * owning one phrasing means a scenario's step is answered by whichever
 * registers last — drift nobody sees from inside either module.
 */
export type DuplicatedPattern = {
  readonly pattern: string;
  readonly modules: readonly string[];
};

/**
 * A catalog `StepDef` whose pattern matched a step text, carrying its
 * `catalog.steps` index and the compiled args in the shape a
 * {@link StepHandler}'s rest parameters take.
 */
export type StepMatch = {
  readonly index: number;
  readonly def: StepDef;
  readonly args: ReadonlyArray<string | number>;
};

/**
 * A step catalog compiled once for matching: `match` returns the first
 * matching `StepDef` in catalog order, `matchAll` every matching one, and
 * `compiledIndexes` holds the `catalog.steps` indexes whose pattern compiled —
 * the rest are reported in `malformedStepDefs`.
 */
export type StepMatcher = {
  readonly compiledIndexes: ReadonlySet<number>;
  readonly malformedStepDefs: readonly MalformedStepDef[];
  match(text: string): StepMatch | undefined;
  matchAll(text: string): readonly StepMatch[];
};

/**
 * The per-scenario verdict {@link FeatureScenario} carries out of
 * `createTraceabilityCheck`: `scenarios` is every one the feature declares, and
 * each falls in exactly one of `driveable` / `partial` / `notYet`. `partial` is
 * the only failing bucket of the three — it reads as driveable and silently is
 * not.
 */
export type TraceabilityResult = {
  readonly scenarios: readonly FeatureScenario[];
  readonly driveable: readonly FeatureScenario[];
  readonly partial: readonly FeatureScenario[];
  readonly notYet: readonly FeatureScenario[];
  readonly orphanStepDefs: readonly StepDef[];
  readonly duplicatedPatterns: readonly DuplicatedPattern[];
  readonly malformedStepDefs: readonly MalformedStepDef[];
};

/**
 * The registration surface `defineSteps` hands its builder callback. Plain
 * data collection only — no engine import, no matching.
 */
export type StepRegistrar = {
  Given(pattern: string, handler: StepHandler): void;
  When(pattern: string, handler: StepHandler): void;
  Then(pattern: string, handler: StepHandler): void;
};
