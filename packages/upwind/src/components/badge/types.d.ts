export type { IconProps } from "../icon/types";

// --------------------------------------------

export interface BadgeProps {
  variant?: "flat" | "tonal" | "outlined";
  color?:
    | "base"
    | "primary"
    | "secondary"
    | "tertiary"
    | "neutral"
    | "success"
    | "error"
    | "warning"
    | "info";
}
