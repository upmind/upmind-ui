import type { IconProps } from "../icon/types";
// --------------------------------------------

export interface CheckboxProps {
  checkedIcon?: IconProps["icon"];
  uncheckedIcon?: IconProps["icon"];
  size?: "sm" | "md" | "lg";
}
