import { type HTMLAttributes } from "vue";
import type { ButtonProps } from "@upmind-automation/upmind-ui";
// ---
// -----------------------------------------------------------------------------
export interface ActionProps extends ButtonProps {
  type?: HTMLButtonElement["type"];
  handler?: Function | string;
  auto?: boolean;
}

export interface AuthProps {
  modelValue: "login" | "register" | "forgot" | "reset" | "profile";
  noHeader?: boolean;
  noFooter?: boolean;
  noTabs?: boolean;
  // --- variants
  color?: ButtonProps["color"];
  blockTabs?: boolean;
  stretchTabs?: boolean;
  // ---
  uiConfig?: { alert: Partial<AuthProps> };
  class?: HTMLAttributes["class"];
}
