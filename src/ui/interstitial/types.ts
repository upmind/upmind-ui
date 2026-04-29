// --- external
import type { AvatarProps } from "../avatar/types";
// --- internal
import type { ButtonProps } from "../button/types";
import type { DialogProps } from "../dialog/types";
import type { IconProps } from "../icon/types";
import type { AnimatedIconProps } from "../icon-animated";
import type { CxOptions } from "class-variance-authority";
import type { HTMLAttributes } from "vue";
// --------------------------------------------------------
// ---
export type InterstitialActionProps = {
  handler?: Function | string;
  prependIcon?: IconProps;
  appendIcon?: IconProps;
} & ButtonProps;

export type InterstitialProps = {
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
  /** Whether the modal can be dismissed via Esc key. Defaults to false. */
  dismissible?: boolean;
  // ---
  size?: DialogProps["size"];
  fit?: DialogProps["fit"];
  // ---
  uiConfig?: { interstitial: CxOptions };
  class?: HTMLAttributes["class"];
};
