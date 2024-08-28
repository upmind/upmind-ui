// --- external
import { type VariantProps } from "class-variance-authority";

// --- internal
import type { alertConfig } from "./alert.config";
export type AlertConfig = VariantProps<typeof alertConfig>;
