// --- external
import type { labelVariants } from "./label.config";
import type { CxOptions, VariantProps } from "class-variance-authority";
import type { LabelProps as RootLabelProps } from "radix-vue";
import type { HTMLAttributes } from "vue";
// --- internal
type LabelVariantProps = VariantProps<typeof labelVariants>;

export interface LabelProps extends RootLabelProps {
  label?: string | number;
  // ---
  uiConfig?: { label: CxOptions };
  class?: HTMLAttributes["class"];
}
