// --- external
import { type HTMLAttributes } from "vue";

// --- types
import type { ButtonProps } from "../button/types";
import type {
  RadioGroupRootProps,
  RadioGroupItemProps,
  PopoverContentProps
} from "radix-vue";
import type { CxOptions, VariantProps } from "class-variance-authority";
import type { BadgeProps } from "../badge/types";
import type { Icon } from "../icon/types";

// --- internal
import type { triggerVariants } from "./selectCards.config";
type TriggerVariantProps = VariantProps<typeof triggerVariants>;

// --- types
import type { AvatarProps } from "../avatar/types";

export interface SelectCardsItemProps extends RadioGroupItemProps {
  item?: any;
  index?: number;
  label: string;
  icon?: Icon | string;
  avatar?: Partial<AvatarProps>;
  appendLabel?: string;
  badge?: BadgeProps | string;
}

export interface SelectCardsProps extends RadioGroupRootProps {
  label?: string;
  placeholder?: string;
  required?: boolean;
  // --- state
  items: SelectCardsItemProps[];
  loading?: boolean;
  disabled?: boolean;
  // ---
  side?: PopoverContentProps["side"];
  align?: "start" | "center" | "end";
  width?: TriggerVariantProps["width"];
  focusable?: boolean;
  to?: string;

  uiConfig?: { select: CxOptions };
  class?: HTMLAttributes["class"];
  contentClass?: HTMLAttributes["class"];
  dataHover?: boolean;
  dataFocus?: boolean;
}
export interface SelectCardsTriggerProps
  extends Omit<ButtonProps, "variant" | "uiConfig"> {
  selected?: { label: string };
  loading?: boolean;
  placeholder?: string;
  label?: string;
  size?: ButtonProps["size"];
  open?: boolean;
  class?: string;
  focusable?: boolean;
  chevron?: boolean;
  dataHover?: boolean;
  dataFocus?: boolean;
}
