import type { IconProps } from "../../../components/icon";
import type { ButtonVariants } from "@upmind/ui";
import type { AnimatedIconVariants } from "@upmind/ui";
import type { RouteLocationAsRelativeGeneric } from "vue-router";

// Mirrors @upmind/ui AnimatedIcon's public props (the lib doesn't
// export them as a type). Config shape for a basket modal's animated icon.
type AnimatedIconProps = {
  icon: string;
  intent?: string;
  trigger?: string;
  delay?: number;
  size?: AnimatedIconVariants["size"];
  primaryColor?: string;
  secondaryColor?: string;
  label?: string;
};

// ---
export type ActionProps = {
  type?: HTMLButtonElement["type"];
  handler?: ((...args: unknown[]) => unknown) | string;
  auto?: boolean;
  prependIcon?: IconProps["icon"];
  appendIcon?: IconProps["icon"];
  visible?: boolean;
} & ButtonVariants;

/** Avatar config for a basket modal (icon + legacy size/shape). */
type AvatarConfig = {
  icon?: string;
  size?: string;
  shape?: string;
};

export interface BasketModalProps {
  modal?: boolean;
  open?: boolean;
  // ---
  title?: string;
  titleI18n?: { key: string; plural?: number };
  text?: string;
  avatar?: AvatarConfig;
  animatedIcon?: AnimatedIconProps;
  action?: ActionProps;
  to?: string;
  // ---
  size?: string;
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
