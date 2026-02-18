import { defineCustomElement } from "vue";
import Tabs from "./Tabs.ce.vue";
import { variants } from "./tabs.config";
import { parseVariants, type VariantValues } from "../../utils";

export { default as Tabs } from "./Tabs.ce.vue";
export type { TabsProps, TabItem } from "./types";

export const UpmTabs = defineCustomElement(Tabs);

export const TABS_OVERFLOW = parseVariants(variants.overflow);

export type TABS_OVERFLOW = VariantValues<typeof TABS_OVERFLOW>;
