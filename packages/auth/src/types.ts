import type { ButtonVariants } from "@upmind/ui";
import type { CxOptions } from "class-variance-authority";
import type { HTMLAttributes } from "vue";
import type { RouteLocationAsRelativeGeneric } from "vue-router";
// -----------------------------------------------------------------------------

/** Avatar config for the session-expired modal (icon + legacy size/shape). */
type AvatarConfig = {
  icon?: string;
  size?: string;
  shape?: string;
};
export type ActionProps = {
  label?: string;
  icon?: string;
  /** Maps onto the Button variant. */
  color?: ButtonVariants["variant"];
  size?: ButtonVariants["size"];
  type?: HTMLButtonElement["type"];
  disabled?: boolean;
  loading?: boolean;
  handler?: ((...args: unknown[]) => unknown) | string;
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
  variant?: ButtonVariants["variant"];
  // ---
  uiConfig?: { alert: CxOptions };
  class?: HTMLAttributes["class"];
  cancelRoute?: RouteLocationAsRelativeGeneric;
};

export type SessionExpiredProps = {
  // ---
  modal?: boolean;
  open?: boolean;
  // ---
  title?: string;
  text?: string;
  avatar?: AvatarConfig;
  action?: ActionProps;
  // ---
  size?: string;
};

export type SessionRoutes = {
  loginRoute: RouteLocationAsRelativeGeneric;
  registerRoute: RouteLocationAsRelativeGeneric;
  recoverRoute: RouteLocationAsRelativeGeneric;
};

export type AuthActionProps = SessionRoutes & {
  shape?: string;
};

export enum SESSION_TEMPLATE {
  SPLIT = "split",
  ENCLOSED = "enclosed",
  CANVAS_CARD = "canvas-card",
  SURFACE_BOX = "surface-box",
  TWO_COLUMN_LTR = "two-column-ltr",
  TWO_COLUMN_RTL = "two-column-rtl",
  INSET = "inset"
}
