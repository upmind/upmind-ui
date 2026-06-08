import { type HTMLAttributes } from "vue";
import type {
  ButtonProps,
  DialogProps,
  AvatarProps
} from "@upmind-automation/upmind-ui";
import type { CxOptions } from "class-variance-authority";
import { AVATAR_SHAPES } from "@upmind-automation/upmind-ui";
import type { RouteLocationAsRelativeGeneric } from "vue-router";
import type { StorefrontRoute } from "../../types";
// -----------------------------------------------------------------------------
export type ActionProps = ButtonProps & {
  type?: HTMLButtonElement["type"];
  handler?: Function | string;
  auto?: boolean;
  visible?: boolean;
};

export const enum SESSION_FORMS {
  LOGIN = "login",
  REGISTER = "register",
  RECOVER = "recover",
  RESET = "reset",
  PROFILE = "profile",
  GUEST = "guest",
  VERIFY = "verify",
  UNKNOWN = "unknown"
}

export type SessionProps = {
  modelValue?: `${SESSION_FORMS}`;
  noHeader?: boolean;
  noFooter?: boolean;
  noTabs?: boolean;
  // --- variants
  blockTabs?: boolean;
  stretchTabs?: boolean;
  variant?: ButtonProps["variant"];
  // ---
  uiConfig?: { alert: CxOptions };
  class?: HTMLAttributes["class"];
  storefrontRoute?: StorefrontRoute;
};

export type SessionExpiredProps = {
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
};

export type SessionRoutes = {
  loginRoute: RouteLocationAsRelativeGeneric;
  registerRoute: RouteLocationAsRelativeGeneric;
  recoverRoute: RouteLocationAsRelativeGeneric;
};

export type AuthActionProps = SessionRoutes & {
  shape?: AVATAR_SHAPES;
};

export enum SESSION_TEMPLATE {
  SPLIT = "split",
  ENCLOSED = "enclosed",
  CANVAS_CARD = "canvas-card",
  SURFACE_BOX = "surface-box",
  TWO_COLUMN_LTR = "two-column-ltr",
  TWO_COLUMN_RTL = "two-column-rtl"
}
