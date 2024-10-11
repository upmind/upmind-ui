// --- external
import type { HTMLAttributes } from "vue";
import type { VariantProps } from "class-variance-authority";
import type {
  SelectRootProps,
  SelectContentProps,
  SelectGroupProps,
  SelectItemProps,
  SelectItemTextProps,
  SelectLabelProps,
  SelectScrollDownButtonProps,
  SelectScrollUpButtonProps,
  SelectSeparatorProps,
  SelectTriggerProps,
  SelectValueProps,
} from "radix-vue";

// --- types
import type { triggerVariants, rootVariants } from "./select.config";
type TriggerVariantProps = VariantProps<typeof triggerVariants>;
type RootVariantProps = VariantProps<typeof rootVariants>;

export interface SelectItem {
  label: string;
  value: string;
}

export interface SelectProps
  extends SelectRootProps,
    SelectContentProps,
    SelectGroupProps,
    SelectItemProps,
    SelectItemTextProps,
    SelectLabelProps,
    SelectScrollDownButtonProps,
    SelectScrollUpButtonProps,
    SelectSeparatorProps,
    SelectTriggerProps,
    SelectValueProps {
  // --- state
  label?: string;
  items: SelectItem[];
  // --- variants
  variant?: TriggerVariantProps["variant"];
  color?: RootVariantProps["color"];
  width: TriggerVariantProps["width"];
  // --- styles
  upwindConfig?: {};
  class?: HTMLAttributes["class"];
}
