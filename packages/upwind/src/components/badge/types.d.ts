export type { IconProps } from "../icon/types";

// --------------------------------------------

export interface BadgeProps {
  variant?: "flat" | "tonal" | "outlined";
  color?:
    | "base"
    | "primary"
    | "secondary"
    | "tertiary"
    | "success"
    | "error"
    | "warning"
    | "info";
}
