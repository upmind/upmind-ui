import type { IconProps } from "../icon/types";

// --------------------------------------------

export interface TabProps {
  id: string;
  label: string;
  icon?: IconProps;
  size?: "sm" | "md" | "lg";
}
