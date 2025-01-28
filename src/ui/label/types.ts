// --- external
import { type HTMLAttributes } from "vue";
import { type LabelProps as RootLabelProps } from "radix-vue";

import type { VariantProps } from "class-variance-authority";

// --- internal
import type { labelVariants } from "./label.config";
type LabelVariantProps = VariantProps<typeof labelVariants>;

export interface LabelProps extends RootLabelProps {
  label?: string | number;
  // ---
  upmindUIConfig?: { label: Partial<LabelVariantProps> };
  class?: HTMLAttributes["class"];
}
