import type { RouteLocationAsRelativeGeneric } from "vue-router";
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

export interface BasketActionProps {
  basketRoute?: RouteLocationAsRelativeGeneric;
}

export interface BasketCheckoutProps {
  disabled: boolean;
  loading: boolean;
}

export interface BasketProductsProps {
  editRoute: RouteLocationAsRelativeGeneric;
  configurable?: boolean;
  disabled?: boolean;
}

export interface SummaryProps {
  /** Itemise each product's configuration instead of listing plain totals. */
  showBreakdown?: boolean;
  /** Links each product back to the step where it is configured. Breakdown only. */
  editRoute?: RouteLocationAsRelativeGeneric;
  showProducts?: boolean;
  showPromotions?: boolean;
  showTotal?: boolean;
  /** The basket aside shows a checkout button below the summary, so its loading
   * skeleton includes a button stand-in; the checkout summary has none. */
  showButton?: boolean;
}

export interface BasketHeroProps {
  loading?: boolean;
}

export interface SummarySkeletonProps {
  showBreakdown?: boolean;
  showProducts?: boolean;
  showButton?: boolean;
  card?: boolean;
}
