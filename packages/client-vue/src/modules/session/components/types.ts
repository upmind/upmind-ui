import { type HTMLAttributes } from "vue";
import type {
  ButtonProps,
  DialogProps,
  AvatarProps
} from "@upmind-automation/upmind-ui";
import type { CxOptions } from "class-variance-authority";
// -----------------------------------------------------------------------------
export interface ActionProps extends ButtonProps {
  type?: HTMLButtonElement["type"];
  handler?: Function | string;
  auto?: boolean;
}

export interface AuthProps {
  modelValue: "login" | "register" | "recover" | "reset" | "profile";
  noHeader?: boolean;
  noFooter?: boolean;
  noTabs?: boolean;
  // --- variants
  color?: ButtonProps["color"];
  blockTabs?: boolean;
  stretchTabs?: boolean;
  // ---
  uiConfig?: { alert: CxOptions };
  class?: HTMLAttributes["class"];
}

export interface SessionExpiredProps {
  // ---
  modal?: boolean;
  open?: DialogProps["open"];
  // ---
  title?: DialogProps["title"];
  text?: DialogProps["description"];
  avatar?: Partial<AvatarProps>;
  action?: ActionProps;
  // ---
  size?: DialogProps["size"];
  skrim?: DialogProps["skrim"];
}
