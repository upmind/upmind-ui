import type { IconProps } from "../icon/types";

// --------------------------------------------

export interface ButtonProps {
  size?: "badge" | "xs" | "sm" | "md" | "lg";
  variant?: "flat" | "outlined" | "ghost" | "link";
  color?:
    | "current"
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
