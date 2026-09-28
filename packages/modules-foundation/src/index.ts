export { TermsAndConditions } from "./brand";

export type { FormRendererEntry } from "./renderers";
export { FORM_RENDERERS, useFormRenderers } from "./renderers";

export type { ShellComponents } from "./shell";
export { provideShellComponents, useShellComponents } from "./shell";

// --- The shared presentation glue

export { Icon } from "./icon";
export { registerIcons, setIconVariant, iconVariant } from "./icon";
export type { IconRef, IconProps, IconImportMap } from "./icon";

export { default as Hero } from "./hero/Hero.vue";

export { Back } from "./navigation";
export type { StorefrontRoute } from "./navigation";

export { Section, Sections, useSection } from "./section";
export type { SectionItem } from "./section";

export { Form, useFormI18n } from "./forms";
