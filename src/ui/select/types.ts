// --- external
import type { HTMLAttributes } from "vue";
import type { CxOptions, VariantProps } from "class-variance-authority";
import type {
  SelectRootProps,
  SelectContentProps,
  SelectItemProps,
  SelectValueProps
} from "radix-vue";

// --- components
import type { IconProps } from "../icon/types";

// --- types
import type { rootVariants } from "./select.config";
type RootVariants = VariantProps<typeof rootVariants>;

export interface SelectProps
  extends Omit<SelectRootProps, "variant">,
    SelectContentProps,
    SelectValueProps {
  // --- state
  items: ({
    label?: string;
    title?: string;
    const?: string;
  } & SelectItemProps)[];
  additionalItems?: SelectItemAdditional[];
  // --- variants;
  variant?: RootVariants["variant"];
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
  dataHover?: boolean;
  dataFocus?: boolean;
}

export interface SelectItemAdditional {
  textValue: string;
  value: string;
  icon: IconProps["icon"];
  emitOnly?: boolean;
}
