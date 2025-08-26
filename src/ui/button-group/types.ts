// --- external
import type { CxOptions } from "class-variance-authority";
import type { HTMLAttributes } from "vue";

// --- internal
import type { ButtonProps } from "../button/types";
import type { SelectProps } from "../select/types";

export type ButtonGroupItem = ButtonGroupButtonItem | ButtonGroupDropdownItem;
export interface ButtonGroupProps {
  variant?: ButtonProps["variant"];
  items: ButtonGroupItem[];
  disabled?: boolean;
  uiConfig?: { buttonGroup: CxOptions };
  class?: HTMLAttributes["class"];
}

export namespace ButtonGroup {
  export const Button = "button" as const;
  export const Select = "select" as const;

  export type Type = typeof Button | typeof Select;
}

export interface ButtonGroupItemBase {
  type: ButtonGroup.Type;
  class?: HTMLAttributes["class"];
  active?: boolean;
}

export interface ButtonGroupButtonItem extends ButtonGroupItemBase {
  type: typeof ButtonGroup.Button;
  props: Omit<ButtonProps, "variant" | "size">;
  handler?: (event: Event) => void;
}

export interface ButtonGroupDropdownItem extends ButtonGroupItemBase {
  type: typeof ButtonGroup.Select;
  props: Omit<SelectProps, "variant" | "size">;
  handler?: (value: any) => void;
}
