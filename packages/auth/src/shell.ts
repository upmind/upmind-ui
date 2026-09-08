/**
 * @module auth/shell
 * @description The shell slots this package asks its host for.
 *
 * Amendment 1 change 3 makes page/layouts/header/footer app-owned, and ADR 023
 * §3 puts `basket` ABOVE `auth`, so neither the page template nor the basket
 * summary may be imported here. Both arrive through `foundation`'s shell socket
 * instead; a host that provides nothing gets the bare template below.
 */
import { SESSION_TEMPLATE } from "./types";

export const AUTH_SHELL = {
  /** Full-page interstitial shown while a resolve/reject navigation is in flight. */
  LOADING: "auth:loading",
  /** The basket-summary aside. Lives in `basket`, which sits above this package. */
  SUMMARY: "auth:summary",
  TEMPLATE_SPLIT: "auth:template:split",
  TEMPLATE_ENCLOSED: "auth:template:enclosed",
  TEMPLATE_CANVAS_CARD: "auth:template:canvas-card",
  TEMPLATE_SURFACE_BOX: "auth:template:surface-box",
  TEMPLATE_TWO_COLUMN_LTR: "auth:template:two-column-ltr",
  TEMPLATE_TWO_COLUMN_RTL: "auth:template:two-column-rtl",
  TEMPLATE_INSET: "auth:template:inset"
} as const;

export type AuthShellSlot = (typeof AUTH_SHELL)[keyof typeof AUTH_SHELL];

export const AUTH_TEMPLATE_SLOT: Record<SESSION_TEMPLATE, AuthShellSlot> = {
  [SESSION_TEMPLATE.SPLIT]: AUTH_SHELL.TEMPLATE_SPLIT,
  [SESSION_TEMPLATE.ENCLOSED]: AUTH_SHELL.TEMPLATE_ENCLOSED,
  [SESSION_TEMPLATE.CANVAS_CARD]: AUTH_SHELL.TEMPLATE_CANVAS_CARD,
  [SESSION_TEMPLATE.SURFACE_BOX]: AUTH_SHELL.TEMPLATE_SURFACE_BOX,
  [SESSION_TEMPLATE.TWO_COLUMN_LTR]: AUTH_SHELL.TEMPLATE_TWO_COLUMN_LTR,
  [SESSION_TEMPLATE.TWO_COLUMN_RTL]: AUTH_SHELL.TEMPLATE_TWO_COLUMN_RTL,
  [SESSION_TEMPLATE.INSET]: AUTH_SHELL.TEMPLATE_INSET
};
