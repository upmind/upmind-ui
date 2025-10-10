// --- external
import { defineCustomElement } from "vue";
import { keys } from "lodash-es";

// --- vue elements
export { default as TabsMinimal } from "./TabsMinimal.ce.vue";

// --- custom elements
import TabsMinimal from "./TabsMinimal.ce.vue";
export const UpmTabsMinimal = defineCustomElement(TabsMinimal);
