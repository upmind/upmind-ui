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
