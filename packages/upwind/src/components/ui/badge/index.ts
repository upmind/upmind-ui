import { type VariantProps } from "class-variance-authority";
import type { badgeConfig } from "./badge.config";

export { default as Badge } from "./Badge.vue";

export { badgeConfig } from "./badge.config";
export type BadgeVariants = VariantProps<typeof badgeConfig>;
