export { default as UwTabs } from "./Tabs.vue";
export { default as UwTabsTrigger } from "./TabsTrigger.vue";
export { default as UwTabsList } from "./TabsList.vue";
export { default as UwTabsContent } from "./TabsContent.vue";

import { type VariantProps } from "class-variance-authority";
import type { default as tabsConfig } from "./tabs.config";
export type TabsConfig = VariantProps<typeof tabsConfig>;
