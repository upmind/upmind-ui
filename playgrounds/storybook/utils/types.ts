export enum colors {
  base = "base",
  primary = "primary",
  secondary = "secondary",
  accent = "accent",
  promotion = "promotion",
  destructive = "destructive",
  success = "success",
  info = "info",
  error = "error",
  warning = "warning",
}

export enum variants {
  ghost = "ghost",
  flat = "flat",
  outline = "outline",
  tonal = "tonal",
}

export enum sizes {
  xs = "xs",
  sm = "sm",
  md = "md",
  lg = "lg",
  icon = "icon",
}
export enum allSizes {
  auto = "auto",
  "3xs" = "3xs",
  "2xs" = "2xs",
  xs = "xs",
  sm = "sm",
  md = "md",
  lg = "lg",
  xl = "xl",
  "2xl" = "2xl",
  "3xl" = "3xl",
}

export enum align {
  start = "start",
  center = "center",
  end = "end",
}

export enum placements {
  top = "top",
  bottom = "bottom",
  left = "left",
  right = "right",
  "bottom-start" = "bottom-start",
  "bottom-end" = "bottom-end",
  "top-start" = "top-start",
  "top-end" = "top-end",
  "left-start" = "left-start",
  "left-end" = "left-end",
  "right-start" = "right-start",
  "right-end" = "right-end",
}

export type ControlType =
  | "text"
  | "number"
  | "boolean"
  | "object"
  | "file"
  | "radio"
  | "select"
  | "multi-select"
  | "color"
  | "date"
  | "range";

export type ArgType = {
  options?: (string | number)[];
  control: {
    type: ControlType;
    labels?: Record<string, string>;
    presetColors?: string[];
    min?: number;
    max?: number;
    step?: number;
  };
};
