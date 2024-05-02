export interface AlertProps {
  variant?: "inline" | "stacked";
  anchor: "none" | "top" | "bottom" | "left" | "right";
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
