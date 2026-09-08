import type { FeatureDefinition } from "./feature.types";

/**
 * The one signature every package's `feature.ts` default-exports (ADR 023 §8).
 * Identity at runtime: it exists to type the contribution, not to transform it.
 */
export const defineFeature = (feature: FeatureDefinition): FeatureDefinition =>
  feature;
