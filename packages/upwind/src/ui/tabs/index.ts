import { type VariantProps } from "class-variance-authority";
import type { default as tabsConfig } from "./tabs.config";
export type TabsConfig = VariantProps<typeof tabsConfig>;

import { defineCustomElement } from "vue";

// --- custom elements
import TabsCE from "./Tabs.ce.vue";
export const UwTabs = defineCustomElement(TabsCE);
