import { type HTMLAttributes } from "vue";
import type {
  ButtonProps,
  DialogProps,
  AvatarProps
} from "@upmind-automation/upmind-ui";
import type { CxOptions } from "class-variance-authority";
import { AVATAR_SHAPES } from "@upmind-automation/upmind-ui";
import type { RouteLocationAsRelativeGeneric } from "vue-router";

// -----------------------------------------------------------------------------
export type ActionProps = ButtonProps & {
  type?: HTMLButtonElement["type"];
  handler?: Function | string;
  auto?: boolean;
  visible?: boolean;
};

export type SessionProps = {
  modelValue?: "login" | "register" | "recover" | "reset" | "profile" | "guest";
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

/**
 * The session form Auth is currently presenting. `GUEST_REGISTER` (a guest
 * client upgrading to a full account) is distinct from `REGISTER` (a new
 * sign-up) — same fields, different submit label/flow.
 */
export enum AUTH_FORM {
  LOGIN = "login",
  REGISTER = "register",
  GUEST_REGISTER = "guest-register",
  RECOVER = "recover",
  UNKNOWN = "unknown"
}
