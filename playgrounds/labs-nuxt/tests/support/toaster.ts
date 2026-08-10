/**
 * @module tests/support/toaster
 * @description The outlet an action outcome is measured at — the same `Sonner`
 * primitive `layouts/default.vue` mounts, so a report is read where the user
 * reads it rather than off a spy on whatever function raised it.
 */

import { flushPromises, mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { Sonner, toast } from "@upmind-automation/upmind-ui";
import { renderedStrings } from "./rendered";

export function mountToaster() {
  const toaster = mount(Sonner, { attachTo: document.body });

  // The outlet's own `aria-label` announces the region, not an outcome — read
  // the toast list rather than the landmark that wraps it.
  const outlet = () => toaster.find("[data-sonner-toaster]");
  const onScreen = () => (outlet().exists() ? renderedStrings(outlet()) : []);

  return {
    /** Everything on screen in the outlet, once every settled report has drawn. */
    async reported(): Promise<string[]> {
      await flushPromises();
      await new Promise(resolve => setTimeout(resolve, 50));
      await nextTick();
      return onScreen();
    },
    /** What is on screen right now — nothing is waited for. */
    reportedSoFar: onScreen
  };
}

/** `vue-sonner` holds its queue in module state, so it outlives a mount. */
export function clearToasts(): void {
  toast.dismiss();
  document.body.innerHTML = "";
}
