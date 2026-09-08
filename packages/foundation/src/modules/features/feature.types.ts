/**
 * @module foundation/features
 * @description The uniform feature contract: ADR 023 §8.
 */
import type { FormRendererEntry } from "../renderers";
import type { FlowRegistrar } from "../routing";
import type { RouteRecordRaw } from "vue-router";

/** The sockets a feature contributes into. Handed to `setup`, never imported by it. */
export type FeatureContext = {
  addRenderers: (renderers: FormRendererEntry[]) => void;
  addRoutes: (routes: RouteRecordRaw[]) => void;
  registerFlows: (register: FlowRegistrar) => void;
};

export type FeatureDefinition = {
  name: string;
  setup: (ctx: FeatureContext) => void;
};
