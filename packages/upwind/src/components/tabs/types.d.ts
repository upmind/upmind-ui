import type { IconProps } from "../icon/types";

// --------------------------------------------

export interface TabsProps {
  align?: "start" | "center" | "end" | "between" | "around" | "evenly";
}

export interface TabProps {
  id: string;
  label: string;
  icon?: IconProps;
  size?: "sm" | "md" | "lg";
}
