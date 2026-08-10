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

export type FeatureStep = {
  readonly kind: StepKind;
  readonly text: string;
  readonly line: number;
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

export type TraceabilityResult = {
  readonly ok: boolean;
  readonly unmatchedFeatureSteps: readonly FeatureStep[];
  readonly orphanStepDefs: readonly StepDef[];
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
