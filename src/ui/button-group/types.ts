// --- external
import type { CxOptions } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "vue";

// --- internal
import type { ButtonProps } from "../button/types";
import type { DropdownMenuProps } from "../dropdown-menu/types";

export type ButtonGroupItem = ButtonGroupButtonItem | ButtonGroupDropdownItem;
export interface ButtonGroupProps {
  color?: ButtonProps["color"];
  variant?: ButtonProps["variant"];
  items: ButtonGroupItem[];
  size?: ButtonProps["size"];
  disabled?: boolean;
  uiConfig?: { buttonGroup: CxOptions };
  class?: HTMLAttributes["class"];
}

export namespace ButtonGroup {
  export const Button = "button" as const;
  export const Dropdown = "dropdown" as const;

  export type Type = typeof Button | typeof Dropdown;
}

export interface ButtonGroupItemBase {
  type: ButtonGroup.Type;
  active?: boolean;
}

export interface ButtonGroupButtonItem extends ButtonGroupItemBase {
  type: typeof ButtonGroup.Button;
  props: Omit<ButtonProps, "variant" | "size">;
  handler?: (event: Event) => void;
}

export interface ButtonGroupDropdownItem extends ButtonGroupItemBase {
  type: typeof ButtonGroup.Dropdown;
  props: Omit<DropdownMenuProps, "variant" | "size">;
}
