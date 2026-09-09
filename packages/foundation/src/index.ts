// ADR 023 §2 — `foundation` owns the empty typed registries and their read APIs.
// Registry ENTRIES live in each contributing package's own `feature.ts`, reached
// through `defineFeature`'s context: the package barrel deliberately publishes no
// direct mutator, and `foundation` imports no domain package.

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

export type {
  FlowRegistrar,
  StorefrontRoute,
  UseRouting
} from "./modules/routing";
export { useRouting } from "./modules/routing";

export type {
  FeatureContext,
  FeatureDefinition,
  UseFeatures
} from "./modules/features";
export { defineFeature, useFeatures } from "./modules/features";

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
export type { BackProps } from "./modules/navigation";

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
