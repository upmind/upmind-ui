// --- external
import { type VariantProps } from "class-variance-authority";

// --- components
export { default as Button } from "./Button.vue";

// --- types
import type { buttonConfig } from "./button.cva";
export type ButtonConfig = VariantProps<typeof buttonConfig>;
