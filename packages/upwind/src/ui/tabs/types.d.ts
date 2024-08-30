// --- external
import { type VariantProps } from "class-variance-authority";

// --- internal
import type { default as tabsConfig } from "./tabs.config";
export type TabsConfig = VariantProps<typeof tabsConfig>;
