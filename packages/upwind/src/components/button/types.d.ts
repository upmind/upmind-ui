import type { IconProps } from "../icon/types";

// --------------------------------------------

export interface ButtonProps {
  size?: "square | badge" | "xs" | "sm" | "md" | "lg";
  variant?: "flat" | "outline" | "ghost" | "link";
  color?:
    | "current"
    | "base"
    | "primary"
    | "secondary"
    | "tertiary"
    | "success"
    | "error"
    | "warning"
    | "info";
}
