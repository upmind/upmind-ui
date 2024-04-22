import type { InputSize } from "./controls/types";
import type { IconProps } from "../../icon/types";

// --------------------------------------------

export interface Options {
  appendAvatar?: IconProps;
  appendIcon?: IconProps;
  focus?: boolean;
  hideFeedback?: boolean;
  hideRequired?: boolean;
  hideStatus?: boolean;
  optionalText?: String;
  focusDescription?: boolean;
  prefix?: String;
  prependAvatar?: IconProps;
  prependIcon?: IconProps;
  requiredText?: String;
  size?: InputSize;
  suffix?: String;
}
