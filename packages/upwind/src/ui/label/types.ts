// --- external
import { type HTMLAttributes } from "vue";
import { type VariantProps } from "class-variance-authority";

// --- internal
import type { labelVariants } from "./label.config";
type LabelVariantProps = VariantProps<typeof labelVariants>;

export interface LabelProps {
  defaultValue?: string | number;
  modelValue?: string | number;
  // ---
  upwindConfig?: { label: Partial<LabelVariantProps> };
  class?: HTMLAttributes["class"];
}
