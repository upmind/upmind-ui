import type { AvatarProps, DialogProps, ButtonProps } from "@upmind/upwind";
// ---
export interface ActionProps extends ButtonProps {
  type?: HTMLButtonElement["type"];
  handler?: Function | string;
  auto?: boolean;
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
  action?: ActionProps;
  // ---
  size?: DialogProps["size"];
  skrim?: DialogProps["skrim"];
}
