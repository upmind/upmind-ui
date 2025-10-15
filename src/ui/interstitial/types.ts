// --- external
import { type HTMLAttributes } from "vue";
import type { CxOptions, VariantProps } from "class-variance-authority";

// --- internal
import type { AvatarProps } from "../avatar/types";
import type { DialogProps } from "../dialog/types";
import type { ButtonProps } from "../button/types";
import type { IconProps } from "../icon/types";
import type { AnimatedIconProps } from "../icon-animated/types";

import type { interstitialVariants } from "./interstitial.config";

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
  to?: DialogProps["to"];
  // ---
  title?: DialogProps["title"];
  text?: DialogProps["description"];
  avatar?: Partial<AvatarProps>;
  animatedIcon?: AnimatedIconProps;
  // ---
  actions?: InterstitialActionProps[];
  // ---
  size?: DialogProps["size"];
  fit?: DialogProps["fit"];
  // ---
  uiConfig?: { interstitial: CxOptions };
  class?: HTMLAttributes["class"];
}
