// --- external
import type { HTMLAttributes } from "vue";
import type { VariantProps } from "class-variance-authority";
import type {
  DropdownMenuRootProps,
  DropdownMenuContentProps,
  DropdownMenuTriggerProps,
} from "radix-vue";

// --- internal
import type { IconProps } from "../icon";
import type { AvatarProps } from "../avatar";
import type { ButtonProps } from "../button";

import type { itemVariants } from "./dropdownMenu.config";
type ItemVariantProps = VariantProps<typeof itemVariants>;

export interface DropdownMenuItemProps {
  label: string;
  value: string;
  icon?: IconProps["icon"];
  avatar?: Partial<AvatarProps>;
  handler?: Function;
  class?: HTMLAttributes["class"];
}

export interface DropdownMenuProps
  extends DropdownMenuRootProps,
    DropdownMenuContentProps,
    DropdownMenuTriggerProps {
  items: DropdownMenuItemProps[];
  title?: string;
  label?: string;
  loading?: boolean;
  // --- variants
  color?: ItemVariantProps["color"];
  variant?: ButtonProps["variant"];
  size: ButtonProps["size"];
  // ---
  avatar?: Partial<AvatarProps>;
  icon?: IconProps["icon"];
  // --- styles
  upwindConfig?: { dropdownMenu: Partial<DropdownMenuProps> };
  class?: HTMLAttributes["class"];
  popoverClass?: HTMLAttributes["class"];
}
