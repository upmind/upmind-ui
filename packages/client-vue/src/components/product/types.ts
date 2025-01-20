import type {
  AvatarProps,
  DialogProps,
  ButtonProps,
  AnimatedIconProps,
} from "@upmind-automation/upwind";
// ---
export interface ActionProps extends ButtonProps {
  type?: HTMLButtonElement["type"];
  handler?: Function | string;
  auto?: boolean;
  prependIcon?: string;
  appendIcon?: string;
}

export interface ProductModalProps {
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
