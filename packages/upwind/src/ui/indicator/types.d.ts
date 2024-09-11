// --- external
import { type VariantProps } from "class-variance-authority";

// --- internal
import type { indicatorConfig } from "./indicator.config";
export type IndicatorConfig = VariantProps<typeof indicatorConfig>;
