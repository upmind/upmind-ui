import type { IconProps } from "../icon/types";
// --------------------------------------------

export interface DropdownProps {
  icon: IconProps["icon"];
  position:
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "bottom-start"
    | "bottom-end"
    | "top-start"
    | "top-end"
    | "left-start"
    | "left-end"
    | "right-start"
    | "right-end";
  items: DropdownItems;
}

interface DropdownItem {
  id: string;
  label?: string;
  icon?: string;
  href?: string;
  action?: () => void;
  disabled?: boolean;
}

export interface DropdownItems extends Record<string, DropdownItem> {}
