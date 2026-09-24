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

export type {
  BrandConfig,
  BrandConfigMeta,
  TermsAndConditionsProps
} from "./brand";
export { TermsAndConditions, useBrandConfig } from "./brand";
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

export type { ShellComponents, UseShellComponents } from "./shell";
export {
  SHELL_COMPONENTS,
  provideShellComponents,
  useShellComponents
} from "./shell";

// --- The shared presentation glue

export { Icon } from "./icon";
export {
  ICON_MAP,
  FALLBACK_ICON,
  resolveLucideIcon,
  registerIcons,
  loadIcon,
  setIconVariant,
  iconVariant,
  hasRegisteredIcons,
  getIconCount
} from "./icon";
export type {
  IconRef,
  IconProps,
  IconSize,
  IconImportMap,
  LoadIconOptions
} from "./icon";

export { Hero } from "./hero";
export type { HeroProps, HeroActionProps } from "./hero";

export { Back } from "./navigation";
export type { BackProps, StorefrontRoute } from "./navigation";

export { Section, Sections, useSection } from "./section";
export type {
  SectionItem,
  SectionActionProps,
  SectionsProps,
  UseSectionProps
} from "./section";

export { Form, useFormI18n } from "./forms";
export type { FormI18n } from "./forms";
