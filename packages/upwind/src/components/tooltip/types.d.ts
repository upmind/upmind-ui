export interface TooltipProps {
  direction?: "top" | "right" | "bottom" | "left";
  variant?: "flat" | "tonal" | "outlined";
  color?:
    | "base"
    | "primary"
    | "secondary"
    | "tertiary"
    | "success"
    | "error"
    | "warning"
    | "info"
    | "promotion";
}
