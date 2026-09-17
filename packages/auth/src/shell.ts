/**
 * @module auth/shell
 * @description The shell slots this package asks its host for.
 *
 * Amendment 1 change 3 makes page/layouts/header/footer app-owned, and ADR 023
 * §3 puts `basket` ABOVE `auth`, so neither the page template nor the basket
 * summary may be imported here. Both arrive through `foundation`'s shell socket
 * instead; a host that provides nothing gets the bare template below.
 */
import { computed } from "vue";
import { useShellComponents } from "@upmind-automation/foundation";
import AuthLoadingTemplate from "./templates/AuthLoading.template.vue";
import { AUTH_TEMPLATE } from "./types";
import type { Component, ComputedRef } from "vue";

export const AUTH_SHELL = {
  /** Full-page interstitial shown while a resolve/reject navigation is in flight. */
  LOADING: "auth:loading",
  /** The basket-summary aside. Lives in `basket`, which sits above this package. */
  SUMMARY: "auth:summary",
  /**
   * The guest-checkout offer on the register screen. The brand toggle behind it
   * is `invoices.guest_checkout.enabled`, so the offer is commerce policy and
   * lives in checkout; this package keeps only the verb it calls.
   */
  GUEST_CHECKOUT: "auth:guest-checkout",
  TEMPLATE_SPLIT: "auth:template:split",
  TEMPLATE_ENCLOSED: "auth:template:enclosed",
  TEMPLATE_CANVAS_CARD: "auth:template:canvas-card",
  TEMPLATE_SURFACE_BOX: "auth:template:surface-box",
  TEMPLATE_TWO_COLUMN_LTR: "auth:template:two-column-ltr",
  TEMPLATE_TWO_COLUMN_RTL: "auth:template:two-column-rtl",
  TEMPLATE_INSET: "auth:template:inset"
} as const;

export type AuthShellSlot = (typeof AUTH_SHELL)[keyof typeof AUTH_SHELL];

/**
 * The interstitial shown while an organism's setup or its resolve navigation is
 * in flight. It always yields a component: an absent host slot falls through to
 * this package's own spinner rather than to nothing.
 */
export function useAuthLoading(): { component: ComputedRef<Component> } {
  const shell = useShellComponents();

  return {
    component: computed(
      () => shell.resolve(AUTH_SHELL.LOADING) ?? AuthLoadingTemplate
    )
  };
}

export const AUTH_TEMPLATE_SLOT: Record<AUTH_TEMPLATE, AuthShellSlot> = {
  [AUTH_TEMPLATE.SPLIT]: AUTH_SHELL.TEMPLATE_SPLIT,
  [AUTH_TEMPLATE.ENCLOSED]: AUTH_SHELL.TEMPLATE_ENCLOSED,
  [AUTH_TEMPLATE.CANVAS_CARD]: AUTH_SHELL.TEMPLATE_CANVAS_CARD,
  [AUTH_TEMPLATE.SURFACE_BOX]: AUTH_SHELL.TEMPLATE_SURFACE_BOX,
  [AUTH_TEMPLATE.TWO_COLUMN_LTR]: AUTH_SHELL.TEMPLATE_TWO_COLUMN_LTR,
  [AUTH_TEMPLATE.TWO_COLUMN_RTL]: AUTH_SHELL.TEMPLATE_TWO_COLUMN_RTL,
  [AUTH_TEMPLATE.INSET]: AUTH_SHELL.TEMPLATE_INSET
};
