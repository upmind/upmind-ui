/**
 * @module foundation/features
 * @description The uniform feature contract: ADR 023 §8.
 */
import type { FormRendererEntry } from "../renderers";

/** The socket a feature contributes into. Handed to `setup`, never imported by it. */
export type FeatureContext = {
  addRenderers: (renderers: FormRendererEntry[]) => void;
};

export type FeatureDefinition = {
  name: string;
  setup: (ctx: FeatureContext) => void;
};
