// --- external
import { type HTMLAttributes, type Component } from "vue";

// --- types
import type { ButtonProps } from "../button";
import type { PopoverContentProps } from "radix-vue";
import type { CxOptions, VariantProps } from "class-variance-authority";
import type { BadgeProps } from "../badge/types";
import type { Icon } from "../icon/types";

// --- internal
import type { triggerVariants } from "./selectCards.config";
type TriggerVariantProps = VariantProps<typeof triggerVariants>;

// --- types
import type { AvatarProps } from "../avatar";

/**
 * Base props from radix-vue primitives, inlined to avoid type portability issues
 * when consuming packages can't resolve transitive radix-vue type references.
 */
interface PrimitiveBaseProps {
  as?: string | Component;
  asChild?: boolean;
}

export interface SelectCardsItemProps extends PrimitiveBaseProps {
  /** The value given as data when submitted with a `name`. */
  value?: string;
  /** When `true`, prevents the user from interacting with the radio item. */
  disabled?: boolean;
  /** Used to identify the radio item within a form. */
  id?: string;
  // --- SelectCards-specific props
  item?: any;
  index?: number;
  label: string;
  icon?: Icon | string;
  avatar?: Partial<AvatarProps>;
  appendLabel?: string;
  badge?: BadgeProps | string;
}

export interface SelectCardsProps extends PrimitiveBaseProps {
  /** The controlled value of the radio item to check. Can be binded as `v-model`. */
  modelValue?: string;
  /** The value of the radio item that should be checked when initially rendered. */
  defaultValue?: string;
  /** The name of the group. Submitted with its owning form as part of a name/value pair. */
  name?: string;
  // --- SelectCards-specific props
  label?: string;
  placeholder?: string;
  required?: boolean;
  // --- state
  items: SelectCardsItemProps[];
  loading?: boolean;
  disabled?: boolean;
  // ---
  side?: PopoverContentProps["side"];
  size?: TriggerVariantProps["size"];
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
export interface SelectCardsTriggerProps extends Omit<
  ButtonProps,
  "variant" | "uiConfig"
> {
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
