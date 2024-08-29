import { type VariantProps } from "class-variance-authority";
import type { default as tabsConfig } from "./tabs.config";
export type TabsConfig = VariantProps<typeof tabsConfig>;

import { defineCustomElement } from "vue";

// --- custom elements
import TabsCE from "./Tabs.ce.vue";
export const UwTabs = defineCustomElement(TabsCE);

import TabsTriggerCE from "./TabsTrigger.ce.vue";
export const UwTabsTrigger = defineCustomElement(TabsTriggerCE);

import TabsListCE from "./TabsList.ce.vue";
export const UwTabsList = defineCustomElement(TabsListCE);

import TabsContentCE from "./TabsContent.ce.vue";
export const UwTabsContent = defineCustomElement(TabsContentCE);
