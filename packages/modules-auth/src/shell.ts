/**
 * @module auth/shell
 * @description Picks the page template from the record the host passes.
 */
import { computed } from "vue";
import type { AUTH_TEMPLATE, AuthTemplates } from "./types";
import type { Component, ComputedRef } from "vue";

export function useAuthTemplate(
  template: () => AUTH_TEMPLATE,
  templates: () => AuthTemplates
): {
  component: ComputedRef<Component>;
} {
  return {
    component: computed(() => {
      const name = template();
      const provided = templates()[name];

      if (!provided) {
        throw new Error(
          `[auth/shell] no template passed for "${name}". Add it to the ` +
            "page's `templates` record."
        );
      }

      return provided;
    })
  };
}
