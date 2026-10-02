import type { ButtonVariants } from "@upmind/ui";
import type { CxOptions } from "class-variance-authority";
import type { Component, HTMLAttributes } from "vue";
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

export const enum AUTH_FORMS {
  LOGIN = "login",
  REGISTER = "register",
  RECOVER = "recover",
  RESET = "reset",
  PROFILE = "profile",
  GUEST = "guest",
  VERIFY = "verify",
  UNKNOWN = "unknown"
}

export type AuthProps = {
  modelValue?: `${AUTH_FORMS}`;
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

export type AuthExpiredProps = {
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

export type AuthRoutes = {
  loginRoute: RouteLocationAsRelativeGeneric;
  registerRoute: RouteLocationAsRelativeGeneric;
  recoverRoute: RouteLocationAsRelativeGeneric;
};

/** The page templates the host hands the organisms, one per `AUTH_TEMPLATE`. */
export type AuthTemplates = Record<AUTH_TEMPLATE, Component>;

export type AuthRecoverViewProps = AuthRoutes & {
  template?: AUTH_TEMPLATE;
  templates: AuthTemplates;
};

export type AuthViewProps = AuthRecoverViewProps;

/** Emitted only when the host runs no funnel; with one, the page takes the funnel step. */
export type AuthViewEmits = {
  resolve: [];
  reject: [];
};

export interface AuthSummarySlotProps {
  showWhileLoading: boolean;
}

export interface AuthGuestCheckoutSlotProps {
  registerAsGuest: () => void;
  isRegistering?: boolean;
  class?: string;
}

export type AuthActionProps = AuthRoutes & {
  shape?: string;
};

export enum AUTH_TEMPLATE {
  SPLIT = "split",
  ENCLOSED = "enclosed",
  CANVAS_CARD = "canvas-card",
  SURFACE_BOX = "surface-box",
  TWO_COLUMN_LTR = "two-column-ltr",
  TWO_COLUMN_RTL = "two-column-rtl",
  INSET = "inset"
}
