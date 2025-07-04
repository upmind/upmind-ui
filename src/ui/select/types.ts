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
import type { selectVariants } from "./select.config";
type SelectVariants = VariantProps<typeof selectVariants>;

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
  // --- variants
  size?: SelectVariants["size"];
  width?: SelectVariants["width"];
  placeholder?: string;
  // --- styles
  uiConfig?: { select: CxOptions };
  class?: HTMLAttributes["class"];
}
