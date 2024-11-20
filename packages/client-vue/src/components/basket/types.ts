import type { Component } from "vue";
import type {
  AvatarProps,
  DialogProps,
  ButtonProps,
  IconProps,
  AnimatedIconProps,
} from "@upmind-automation/upwind";
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

export interface PaymentDetailsProps {
  cardComponent?: Component | "div";
  class?: string;
}

export interface CheckoutProps {
  cardComponent?: Component | "div";
  contentComponent?: Component | "div";
}
