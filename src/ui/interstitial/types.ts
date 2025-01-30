// --- external
import { type HTMLAttributes } from "vue";
import type { VariantProps } from "class-variance-authority";

// --- internal
import type { AvatarProps } from "../avatar/types";
import type { DialogProps } from "../dialog/types";
import type { ButtonProps } from "../button/types";
import type { IconProps } from "../icon/types";
import type { AnimatedIconProps } from "../icon-animated";

import type { interstitialVariants } from "./interstitial.config";
type InterstitialVariantProps = VariantProps<typeof interstitialVariants>;

// --------------------------------------------------------

// ---
export interface InterstitialActionProps extends ButtonProps {
  handler?: Function | string;
  href?: string;
  prependIcon?: IconProps;
  appendIcon?: IconProps;
  variant?: ButtonProps["variant"];
}

export interface InterstitialProps {
  modal?: boolean;
  open?: DialogProps["open"];
  // ---
  title?: DialogProps["title"];
  text?: DialogProps["description"];
  avatar?: AvatarProps;
  animatedIcon?: AnimatedIconProps;
  // ---
  actions?: InterstitialActionProps[];
  // ---
  size?: DialogProps["size"];
  skrim?: DialogProps["skrim"];
  fit?: DialogProps["fit"];
  // ---
  uiConfig?: { interstitial: Partial<InterstitialVariantProps> };
  class?: HTMLAttributes["class"];
}
