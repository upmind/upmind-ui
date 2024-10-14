// --- external
import type { HTMLAttributes } from "vue";
import type { VariantProps } from "class-variance-authority";
import type {
  SelectRootProps,
  SelectContentProps,
  SelectItemProps,
  SelectValueProps,
} from "radix-vue";

// --- types
import type { selectVariants } from "./select.config";
type SelectVariants = VariantProps<typeof selectVariants>;

export interface SelectProps
  extends SelectRootProps,
    SelectContentProps,
    SelectValueProps {
  // --- state
  items: ({ label?: string } & SelectItemProps)[];
  // --- variants
  size: SelectVariants["size"];
  // --- styles
  upwindConfig?: {};
  class?: HTMLAttributes["class"];
}
