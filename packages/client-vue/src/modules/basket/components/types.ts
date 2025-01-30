import type {
  AvatarProps,
  DialogProps,
  ButtonProps,
  IconProps,
  AnimatedIconProps,
} from "@upmind-automation/upmind-ui";
// ---
export interface ActionProps extends ButtonProps {
  type?: HTMLButtonElement["type"];
  handler?: Function | string;
  auto?: boolean;
  href?: string;
  prependIcon?: IconProps["icon"];
  appendIcon?: IconProps["icon"];
  variant?: ButtonProps["variant"];
}

export interface BasketModalProps {
  modal?: boolean;
  open?: DialogProps["open"];
  // ---
  title?: DialogProps["title"];
  text?: DialogProps["description"];
  avatar?: AvatarProps;
  animatedIcon?: AnimatedIconProps;
  action?: ActionProps;
  to?: string;
  // ---
  size?: DialogProps["size"];
  skrim?: DialogProps["skrim"];
}

import type { BadgeProps } from "@upmind-automation/upmind-ui";

export interface PromotionBadgeProps {
  id?: string;
  amount?: number;
  amountFormatted?: string;
  mixed?: boolean;
  // ---
  label?: string;
  size?: BadgeProps["size"];
  variant?: BadgeProps["variant"];
  color?: BadgeProps["color"];
}
