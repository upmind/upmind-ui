import type { IconProps } from "../icon/types";
// --------------------------------------------

export interface CheckboxProps {
  checkedIcon?: IconProps["icon"];
  uncheckedIcon?: IconProps["icon"];
  indeterminateIcon?: IconProps["icon"];
  size?: "sm" | "md" | "lg";
}
