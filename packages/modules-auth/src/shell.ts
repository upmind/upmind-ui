/**
 * @module auth/shell
 * @description The shell slots this package asks its host for.
 */
import { computed } from "vue";
import { useShellComponents } from "@upmind-automation/foundation";
import AuthLoading from "./components/AuthLoading.vue";
import { AUTH_TEMPLATE } from "./types";
import type { Component, ComputedRef } from "vue";

export const AUTH_SHELL = {
  LOADING: "auth:loading",
  SUMMARY: "auth:summary",
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

export function useAuthLoading(): { component: ComputedRef<Component> } {
  const shell = useShellComponents();

  return {
    component: computed(() => shell.resolve(AUTH_SHELL.LOADING) ?? AuthLoading)
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

export function useAuthTemplate(template: () => AUTH_TEMPLATE): {
  component: ComputedRef<Component>;
} {
  const shell = useShellComponents();

  return {
    component: computed(() => {
      const slot = AUTH_TEMPLATE_SLOT[template()];
      const provided = shell.resolve(slot);

      if (!provided) {
        throw new Error(
          `[auth/shell] no template registered for "${slot}". Register one ` +
            "with provideShellComponents at app root."
        );
      }

      return provided;
    })
  };
}
