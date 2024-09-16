export interface DialogProps {
  size: "auto" | "full" | "sm" | "md" | "lg" | "xl" | "2xl";
  skrim?:
    | "none"
    | "dark"
    | "light"
    | "normal"
    | "primary"
    | "secondary"
    | "accent"
    | "success"
    | "error"
    | "warning"
    | "info";
}
