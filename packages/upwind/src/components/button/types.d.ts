import type { IconProps } from "../icon/types";

// --------------------------------------------

export interface ButtonProps {
  size?: "sm" | "md" | "lg";
  variant?: "flat" | "outlined" | "ghost" | "link";
  color?:
    | "current"
    | "primary"
    | "secondary"
    | "tertiary"
    | "neutral"
    | "success"
    | "error"
    | "warning"
    | "info";
}
