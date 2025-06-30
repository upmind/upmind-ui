// --- external
import type { HTMLAttributes } from "vue";
import type { CxOptions, VariantProps } from "class-variance-authority";
import type {
  DropdownMenuRootProps,
  DropdownMenuContentProps,
  DropdownMenuTriggerProps
} from "radix-vue";

// --- internal
import type { IconProps } from "../icon";
import type { AvatarProps } from "../avatar";
import type { ButtonProps } from "../button";

import type { contentVariants, itemVariants } from "./dropdown-menu.config";
type ContentVariantProps = VariantProps<typeof contentVariants>;
type ItemVariantProps = VariantProps<typeof itemVariants>;

export interface DropdownMenuItemProps {
  label: string;
  value: string;
  icon?: IconProps["icon"];
  avatar?: Partial<AvatarProps>;
  handler?: Function;
  disabled?: boolean;
  hidden?: boolean;
  class?: HTMLAttributes["class"];
}

export interface DropdownMenuProps
  extends DropdownMenuRootProps,
    DropdownMenuContentProps,
    DropdownMenuTriggerProps {
  title?: string;
  label?: string;
  sublabel?: string;
  tag?: string;
  avatar?: Partial<AvatarProps>;
  icon?: IconProps["icon"];
  // --- state
  items: DropdownMenuItemProps[];
  loading?: boolean;
  // --- variants
  color?: ItemVariantProps["color"] | string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  width?: ContentVariantProps["width"] | string;
  // --- styles
  uiConfig?: { dropdownMenu: CxOptions };
  class?: HTMLAttributes["class"];
  popoverClass?: HTMLAttributes["class"];
  itemClass?: HTMLAttributes["class"];
}
