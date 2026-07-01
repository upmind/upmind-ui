import type {
  AvatarProps,
  DialogProps,
  ButtonProps,
  IconProps,
  AnimatedIconProps
} from "@upmind-automation/upmind-ui";
import type { BadgeProps } from "@upmind-automation/upmind-ui";

// ---
export type ActionProps = {
  type?: HTMLButtonElement["type"];
  handler?: ((...args: unknown[]) => unknown) | string;
  auto?: boolean;
  prependIcon?: IconProps["icon"];
  appendIcon?: IconProps["icon"];
  visible?: boolean;
} & ButtonProps;

export interface BasketModalProps {
  modal?: boolean;
  open?: DialogProps["open"];
  // ---
  title?: DialogProps["title"];
  titleI18n?: { key: string; plural?: number };
  text?: DialogProps["description"];
  avatar?: Partial<AvatarProps>;
  animatedIcon?: AnimatedIconProps;
  action?: ActionProps;
  to?: string;
  // ---
  size?: DialogProps["size"];
}

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

export interface BasketCheckoutProps {
  disabled: boolean;
  loading: boolean;
}
