// --- external
import type { ButtonProps } from "../button/types";
import type { SelectProps } from "../select/types";
import type { CxOptions } from "class-variance-authority";
import type { HTMLAttributes } from "vue";
// --- internal

export type ButtonGroupItem = ButtonGroupButtonItem | ButtonGroupDropdownItem;
export type ButtonGroupProps = {
  items: ButtonGroupItem[];
  disabled?: boolean;
  to?: string;
  uiConfig?: { buttonGroup: CxOptions };
  class?: HTMLAttributes["class"];
}

export namespace ButtonGroup {
  export const Button = "button" as const;
  export const Select = "select" as const;

  export type Type = typeof Button | typeof Select;
}

export type ButtonGroupItemBase = {
  type: ButtonGroup.Type;
  class?: HTMLAttributes["class"];
  active?: boolean;
}

export type ButtonGroupButtonItem = ButtonGroupItemBase & {
  type: typeof ButtonGroup.Button;
  props: Omit<ButtonProps, "variant" | "size">;
  handler?: (event: Event) => void;
}

export type ButtonGroupDropdownItem = ButtonGroupItemBase & {
  type: typeof ButtonGroup.Select;
  props: Omit<SelectProps, "variant" | "size">;
  handler?: (value: any) => void;
}
