// --- external
import type { BadgeProps } from "../badge";
import type { LinkProps } from "../link";

export interface ItemContentActionProps extends LinkProps {
  handler?: Function | string;
  type?: HTMLButtonElement["type"];
  visible?: boolean;
}

export interface ItemContentItemProps {
  label?: string;
  secondaryLabel?: string;
  description?: string;
  secondaryDescription?: string;
  badge?: BadgeProps | BadgeProps[];
  secondaryBadge?: BadgeProps | BadgeProps[];
  action?: ItemContentActionProps;
}
