import type { IconProps } from "../icon/types";
// --------------------------------------------

export interface RadioProps {
  checkedIcon?: IconProps["icon"];
  uncheckedIcon?: IconProps["icon"];
  size?: "sm" | "md" | "lg";
}
