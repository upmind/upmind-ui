// ADR 023 §2 — `foundation` owns the empty typed registry and its read API.
// Registry ENTRIES live in each contributing package's own `feature.ts`, reached
// through `defineFeature`'s context: the package barrel deliberately publishes no
// direct mutator, and `foundation` imports no domain package.
//
// Routes and funnel flows are NOT here. An app owns its own router: it composes
// its route array from the records a package exports, and calls that package's
// flow registrar with its own router instance. That is the shape `apps/cart`
// has always had, and a registry in this package only sent the records on a
// round trip to reach the app that already imported them.

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

export type {
  FeatureContext,
  FeatureDefinition,
  UseFeatures
} from "./modules/features";
export { defineFeature, useFeatures } from "./modules/features";
