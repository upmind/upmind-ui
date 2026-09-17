import type { ButtonVariants } from "@upmind/ui";
import type { CxOptions } from "class-variance-authority";
import type { HTMLAttributes, MaybeRefOrGetter } from "vue";
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

/**
 * What the recovery screen takes. It names no landing: recovery ends on its own
 * screen with the email-sent message, so no host has one to name.
 */
export type AuthRecoverViewProps = AuthRoutes & {
  template?: AUTH_TEMPLATE;
};

/** What the two sign-in screens take: recovery's contract, plus a landing. */
export type AuthViewProps = AuthRecoverViewProps & {
  /**
   * Where an accepted sign-in lands in a host that drives no funnel. A host
   * with a funnel leaves it unset and keeps the step the funnel resolves.
   */
  landingRoute?: RouteLocationAsRelativeGeneric;
};

/** What a session screen tells `useAuthResolve` about its own back control. */
export type AuthResolveOptions = {
  /**
   * Where the back control lands in a host that drives no funnel. A screen that
   * names none renders no back control there: its back is the basket, and a
   * funnel-free host has no basket to return to.
   */
  rejectRoute?: MaybeRefOrGetter<RouteLocationAsRelativeGeneric | undefined>;
};

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
