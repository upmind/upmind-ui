// --- external
import { defineCustomElement } from "vue";

// --- internal
import { parseVariants, type VariantValues } from "../../utils";

// --- vue elements
export { default as Tabs } from "./Tabs.ce.vue";
export type { TabsProps, TabItem } from "./types";

// --- custom elements
import Tabs from "./Tabs.ce.vue";
export const UpmTabs = defineCustomElement(Tabs);

// --- types
import { variants } from "./tabs.config";
export const TABS_VARIANTS = parseVariants(variants.variant);
export const TABS_OVERFLOW = parseVariants(variants.overflow);

export type TABS_VARIANTS = VariantValues<typeof TABS_VARIANTS>;
export type TABS_OVERFLOW = VariantValues<typeof TABS_OVERFLOW>;
