// ADR 023 §2 — `foundation` owns the renderer seam's read side, and nothing
// else. An app composes the renderer array from the packages it already imports
// and provides it at app level; `foundation` reads it back and so imports no
// domain package.
//
// Routes and funnel flows are NOT here. An app owns its own router: it composes
// its route array from the records a package exports, and calls that package's
// flow registrar with its own router instance. That is the shape `apps/cart`
// has always had, and a registry in this package only sent the records on a
// round trip to reach the app that already imported them.

export type { BrandConfig, BrandConfigMeta } from "./brand";
export { useBrandConfig } from "./brand";
export type { UseBrandConfig } from "./brand";

export type {
  BrandThemeMeta,
  ColorScheme,
  ThemeEngine,
  UseBrandTheme
} from "./theming";
export {
  COLOR_SCHEME,
  THEME_ENGINE,
  provideThemeEngine,
  useThemeEngine,
  useBrandTheme
} from "./theming";

export type { FormRendererEntry, UseFormRenderers } from "./renderers";
export {
  FORM_RENDERERS,
  provideFormRenderers,
  useFormRenderers
} from "./renderers";
