export const enum ListboxPosition {
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

export interface ListboxItem {
  id: string;
  label?: string;
  icon?: string;
  href?: string;
  action?: () => void;
  disabled?: boolean;
}

export interface ListboxItems extends Record<string, ListboxItem> {}
