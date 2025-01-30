import type {
  AvatarProps,
  DialogProps,
  ButtonProps,
  AnimatedIconProps,
  IconProps,
} from "@upmind-automation/upmind-ui";
// ---
export interface ActionProps extends ButtonProps {
  type?: HTMLButtonElement["type"];
  handler?: Function | string;
  auto?: boolean;
  href?: string;
  prependIcon?: IconProps["icon"];
  appendIcon?: IconProps["icon"];
}

export interface OrderConfirmationProps {
  orderId: string;
  success: boolean;
  // ---
  modal?: boolean;
  open?: DialogProps["open"];
  // ---
  title?: DialogProps["title"];
  text?: DialogProps["description"];
  avatar?: AvatarProps;
  animatedIcon?: AnimatedIconProps;
  action?: ActionProps;
  // ---
  size?: DialogProps["size"];
  skrim?: DialogProps["skrim"];
}
