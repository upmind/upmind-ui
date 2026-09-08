// ADR 023 §2 — `foundation` owns the empty typed registries and their read APIs.
// Registry ENTRIES live in each contributing package's own `feature.ts`, reached
// through `defineFeature`'s context: the package barrel deliberately publishes no
// direct mutator, and `foundation` imports no domain package.

export type { BrandConfig, BrandConfigMeta } from "./modules/brand";
export { useBrandConfig } from "./modules/brand";
export type { UseBrandConfig } from "./modules/brand";

export type {
  BrandThemeMeta,
  ColorScheme,
  ThemeEngine,
  UseBrandTheme
} from "./modules/theming";
export {
  COLOR_SCHEME,
  THEME_ENGINE,
  provideThemeEngine,
  useThemeEngine,
  useBrandTheme
} from "./modules/theming";

export type { FormRendererEntry, UseFormRenderers } from "./modules/renderers";
export {
  FORM_RENDERERS,
  provideFormRenderers,
  useFormRenderers
} from "./modules/renderers";

export type { FlowRegistrar, UseRouting } from "./modules/routing";
export { useRouting } from "./modules/routing";

export type {
  FeatureContext,
  FeatureDefinition,
  UseFeatures
} from "./modules/features";
export { defineFeature, useFeatures } from "./modules/features";
