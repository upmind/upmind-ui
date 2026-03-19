// --- external
import type { labelVariants } from "./label.config";
import type { CxOptions, VariantProps } from "class-variance-authority";
import type { LabelProps as RootLabelProps } from "radix-vue";
import type { HTMLAttributes } from "vue";
// --- internal
type _LabelVariantProps = VariantProps<typeof labelVariants>;

export type LabelProps = RootLabelProps & {
  label?: string | number;
  // ---
  uiConfig?: { label: CxOptions };
  class?: HTMLAttributes["class"];
};
