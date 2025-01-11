// --- external
import { defineCustomElement } from "vue";

// --- vue elements
export { default as Tabs } from "./Tabs.ce.vue";
export type { TabsProps, TabItems } from "./types";

// --- custom elements
import Tabs from "./Tabs.ce.vue";
export const UpmTabs = defineCustomElement(Tabs);
