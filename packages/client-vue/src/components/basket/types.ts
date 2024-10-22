import type {
  AvatarProps,
  DialogProps,
  ButtonProps,
  IconProps,
} from "@upmind/upwind";
// ---
export interface ActionProps extends ButtonProps {
  type?: HTMLButtonElement["type"];
  handler?: Function | string;
  auto?: boolean;
  href?: string;
  prependIcon?: IconProps["icon"];
}

export interface BasketModalProps {
  modal?: boolean;
  open?: DialogProps["open"];
  // ---
  title?: DialogProps["title"];
  text?: DialogProps["description"];
  avatar?: AvatarProps;
  action?: ActionProps;
  // ---
  size?: DialogProps["size"];
  skrim?: DialogProps["skrim"];
}
