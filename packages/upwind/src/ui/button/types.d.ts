// --- external
import { type VariantProps } from "class-variance-authority";

// --- internal
import type { buttonConfig } from "./button.config";
export type ButtonConfig = VariantProps<typeof buttonConfig>;
