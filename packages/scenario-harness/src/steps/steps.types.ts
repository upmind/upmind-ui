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

export interface StepDef {
  kind: StepKind;
  pattern: string; // cucumber-expression source — data, matched executor-side
  handler: StepHandler;
}

export interface StepCatalog {
  steps: ReadonlyArray<StepDef>;
}

export interface FeatureStep {
  readonly kind: StepKind;
  readonly text: string;
  readonly line: number;
}

export interface TraceabilityResult {
  readonly ok: boolean;
  readonly unmatchedFeatureSteps: readonly FeatureStep[];
  readonly orphanStepDefs: readonly StepDef[];
}

/**
 * The registration surface `defineSteps` hands its builder callback. Plain
 * data collection only — no engine import, no matching.
 */
export interface StepRegistrar {
  Given(pattern: string, handler: StepHandler): void;
  When(pattern: string, handler: StepHandler): void;
  Then(pattern: string, handler: StepHandler): void;
}
