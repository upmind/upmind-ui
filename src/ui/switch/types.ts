// --- external
import type { SwitchRootProps } from "radix-vue";
import type { switchVariants } from "./switch.config";
import type { CxOptions, VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "vue";
// -----------------------------------------------------------------------------

type _InputVariantProps = VariantProps<typeof switchVariants>;

export type SwitchProps = SwitchRootProps & {
  uiConfig?: { input: CxOptions };
  class?: HTMLAttributes["class"];
};
