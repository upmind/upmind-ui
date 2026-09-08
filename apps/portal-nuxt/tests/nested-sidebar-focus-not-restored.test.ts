import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import type { ResolvedShell } from "~/portal/resolve";
import { MENU_MODULE_ID } from "~/portal/registry";
import PortalFrame from "~/portal/shell/PortalFrame.vue";
import { PRIMITIVE_ID } from "~/portal/types";

/**
 * bdd.md B5 — "a nested sidebar level moves focus and gives it back". Paired
 * blind with tests/nested-sidebar-focus-not-restored.must-fail.patch.
 */
function frameProps(shell: ResolvedShell) {
  return {
    shell,
    sidebarLabel: "Primary navigation",
    sidebarCloseLabel: "Close navigation",
    sidebarBackLabel: "Back",
    actionPaneLabel: "Details",
    actionPaneCloseLabel: "Close details",
    skipLabel: "Skip to content"
  };
}

describe("PortalFrame — B5: nested sidebar focus", () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, "useRoute");
  });

  it("moves focus into the child level on activation and gives it back to the group row on the way out", async () => {
    Object.assign(globalThis, { useRoute: () => ({ path: "/" }) });
    const shell: ResolvedShell = {
      primitives: {
        [PRIMITIVE_ID.SIDEBAR]: {
          variant: "nested",
          slots: {
            middle: {
              status: "module",
              id: MENU_MODULE_ID,
              variant: "default",
              props: {
                items: [
                  { to: "/a", label: "Alpha", icon: "svg" },
                  {
                    to: "/group",
                    label: "Group",
                    icon: "svg",
                    children: [
                      { to: "/g1", label: "Child One", icon: "svg" },
                      { to: "/g2", label: "Child Two", icon: "svg" }
                    ]
                  }
                ]
              }
            }
          }
        }
      },
      content: {}
    };

    const wrapper = mount(PortalFrame, {
      props: frameProps(shell),
      attachTo: document.body
    });

    const groupRow = wrapper
      .findAll('[data-test-key="sidebar-nav-link"]')
      .find(node => node.attributes("data-test-value") === "Group");
    expect(groupRow?.exists()).toBe(true);

    await groupRow?.trigger("click");

    expect(wrapper.find('[data-test-value="Child One"]').exists()).toBe(true);
    expect(document.activeElement?.getAttribute("data-test-key")).toBe(
      "sidebar-nav-back"
    );

    const backRow = wrapper.find('[data-test-key="sidebar-nav-back"]');
    await backRow.trigger("click");

    expect(wrapper.find('[data-test-value="Child One"]').exists()).toBe(false);
    expect(document.activeElement?.getAttribute("data-test-key")).toBe(
      "sidebar-nav-link"
    );
    expect(document.activeElement?.getAttribute("data-test-value")).toBe(
      "Group"
    );

    wrapper.unmount();
  });
});
