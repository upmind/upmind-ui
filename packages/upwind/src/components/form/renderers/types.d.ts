import type { InputSize } from "./controls/types";

export interface Options {
  persistDescription?: boolean;
  hideRequired?: boolean;
  requiredText?: string;
  optionalText?: string;
  size?: InputSize;
  focus?: boolean;
  step?: number;
  prefix?: string;
  suffix?: string;
}
