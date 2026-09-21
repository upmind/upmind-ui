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
} from "./modules/brand";
export { TermsAndConditions, useBrandConfig } from "./modules/brand";
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

export type { ShellComponents, UseShellComponents } from "./modules/shell";
export {
  SHELL_COMPONENTS,
  provideShellComponents,
  useShellComponents
} from "./modules/shell";

// --- The shared presentation glue. §2 admission is counted, not asserted: past
// `auth`, Icon is imported by 12 client-vue modules, Hero by 9, Section by 8 and
// Back by basket, billing and checkout — each of them a later box.

export { Icon } from "./modules/icon";
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
} from "./modules/icon";
export type {
  IconRef,
  IconProps,
  IconSize,
  IconImportMap,
  LoadIconOptions
} from "./modules/icon";

export { Hero } from "./modules/hero";
export type { HeroProps, HeroActionProps } from "./modules/hero";

export { Back } from "./modules/navigation";
export type { BackProps, StorefrontRoute } from "./modules/navigation";

// `Sections` earns its place on the barrel as a MULTI-section container, not as
// `Section`'s body: `client-vue`'s BillingForm builds its tab set out of it, and
// the same package re-publishes it as `UpmSections` for the labs playground.
// `auth` takes `Section` alone.
export { Section, Sections, useSection } from "./modules/section";
export type {
  SectionItem,
  SectionActionProps,
  SectionsProps,
  UseSectionProps
} from "./modules/section";

export { Form, useFormI18n } from "./modules/forms";
export type { FormI18n } from "./modules/forms";
