import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import type { ResolvedShell } from "~/portal/resolve";
import { BOTTOM_NAV_MODULE_ID } from "~/portal/registry";
import PortalFrame from "~/portal/shell/PortalFrame.vue";
import { PRIMITIVE_ID } from "~/portal/types";

/**
 * bdd.md B5 — "the bottom bar reserves nothing at desktop". Paired blind
 * with tests/bottom-nav-track-every-width.must-fail.patch.
 */
function frameProps(shell: ResolvedShell) {
  return {
    shell,
    sidebarLabel: "Primary navigation",
    sidebarCloseLabel: "Close navigation",
    sidebarBackLabel: "Back",
    actionPaneLabel: "Details",
    actionPaneCloseLabel: "Close details",
    actionPaneTriggerLabel: "Open details",
    skipLabel: "Skip to content"
  };
}

describe("PortalFrame — B5: the bottom bar reserves nothing at desktop", () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, "useRoute");
  });

  it("renders the bottom nav hidden at lg+ rather than at every width", () => {
    Object.assign(globalThis, { useRoute: () => ({ path: "/" }) });
    const shell: ResolvedShell = {
      primitives: {
        [PRIMITIVE_ID.BOTTOM]: {
          variant: undefined,
          slots: {
            default: {
              status: "module",
              id: BOTTOM_NAV_MODULE_ID,
              variant: "default",
              props: {
                items: [{ to: "/a", label: "Alpha", icon: "svg" }],
                label: "Bottom navigation"
              }
            }
          }
        }
      },
      content: {}
    };

    const wrapper = mount(PortalFrame, { props: frameProps(shell) });
    const nav = wrapper.find('[data-slot="bottom-nav"]');

    expect(nav.exists()).toBe(true);
    // A bar that reserves its track "at every width" is one missing this
    // guard — visible (and therefore occupying its track) at lg+ too.
    expect(nav.classes()).toContain("lg:hidden");
    expect(nav.classes()).not.toContain("hidden");
  });

  it("renders no bottom chrome at all when no bottom module is configured", () => {
    Object.assign(globalThis, { useRoute: () => ({ path: "/" }) });
    const wrapper = mount(PortalFrame, {
      props: frameProps({ primitives: {}, content: {} })
    });

    expect(wrapper.find('[data-slot="bottom-nav"]').exists()).toBe(false);
  });
});
