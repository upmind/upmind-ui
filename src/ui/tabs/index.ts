// --- external
import { defineCustomElement } from "vue";
import { keys } from "lodash-es";

// --- vue elements
export { default as Tabs } from "./Tabs.ce.vue";
export type { TabsProps, TabItem } from "./types";

// --- custom elements
import Tabs from "./Tabs.ce.vue";
export const UpmTabs = defineCustomElement(Tabs);

import { variants } from "./tabs.config";
export const VARIANTS_ALIGNMENT = keys(variants.alignment);
export const VARIANTS_WIDTH = keys(variants.width);
