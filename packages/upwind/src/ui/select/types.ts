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

// --- internal
import type { ButtonProps } from "../button";

import type { triggerVariants } from "./select.config";
type TriggerVariantProps = VariantProps<typeof triggerVariants>;

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
  color?: ButtonProps["color"];
  variant?: ButtonProps["variant"];
  width: TriggerVariantProps["width"];
  // --- styles
  upwindConfig?: {};
  class?: HTMLAttributes["class"];
}
