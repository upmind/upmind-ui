import type { IconProps } from "../icon/types";

// --------------------------------------------

export interface TabsProps {
  align?: "start" | "center" | "end" | "between" | "around" | "evenly";
}

export interface TabProps {
  value: string;
  label: string;
  icon?: IconProps;
  size?: "sm" | "md" | "lg";
}
