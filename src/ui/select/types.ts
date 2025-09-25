// --- external
import type { HTMLAttributes } from "vue";
import type { CxOptions, VariantProps } from "class-variance-authority";
import type {
  SelectRootProps,
  SelectContentProps,
  SelectItemProps,
  SelectValueProps
} from "radix-vue";

// --- types
import type { rootVariants } from "./select.config";
type RootVariants = VariantProps<typeof rootVariants>;

export interface SelectProps
  extends SelectRootProps,
    SelectContentProps,
    SelectValueProps {
  // --- state
  items: ({
    label?: string;
    title?: string;
    const?: string;
  } & SelectItemProps)[];
  // --- variants;
  width?: RootVariants["width"];
  size?: RootVariants["size"];
  placeholder?: string;
  ring?: boolean;
  to?: string;
  // --- styles
  uiConfig?: {
    select: {
      root: CxOptions;
      value: CxOptions;
      item: CxOptions;
    };
  };
  class?: HTMLAttributes["class"];
}
