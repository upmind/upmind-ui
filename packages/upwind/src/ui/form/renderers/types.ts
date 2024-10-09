import type { IconProps } from "../../icon/types";

// --------------------------------------------

export interface Options {
  appendAvatar?: IconProps;
  appendIcon?: IconProps;
  focus?: boolean;
  noFeedback?: boolean;
  noRequired?: boolean;
  noStatus?: boolean;
  optionalText?: String;
  focusDescription?: boolean;
  prefix?: String;
  prependAvatar?: IconProps;
  prependIcon?: IconProps;
  requiredText?: String;
  size?: "sm" | "md" | "lg";
  suffix?: String;
}
