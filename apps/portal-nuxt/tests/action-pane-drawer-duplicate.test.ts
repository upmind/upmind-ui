import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import type { ResolvedShell } from "~/portal/resolve";
import { FIXTURE_MODULE_ID } from "~/portal/registry";
import PortalFrame from "~/portal/shell/PortalFrame.vue";
import { PRIMITIVE_ID } from "~/portal/types";

/**
 * bdd.md B5 — "the pane is a column at lg+ and a drawer below": "a query for
 * the pane's marker returns exactly one node at both widths". Mirrors
 * portal-frame.test.ts's sidebar version for the `utility` primitive.
 * Paired blind with tests/action-pane-drawer-duplicate.must-fail.patch.
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

describe("PortalFrame — B5: the action pane has exactly one copy in the tree", () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, "useRoute");
  });

  it("mounts the utility primitive's module once, not once inline and once again for the drawer", () => {
    Object.assign(globalThis, { useRoute: () => ({ path: "/" }) });
    const shell: ResolvedShell = {
      primitives: {
        [PRIMITIVE_ID.UTILITY]: {
          variant: "persistent",
          slots: {
            top: { status: "module", id: FIXTURE_MODULE_ID, variant: "default" }
          }
        }
      },
      content: {}
    };

    const wrapper = mount(PortalFrame, { props: frameProps(shell) });
    const markers = wrapper.findAll('[data-slot="portal-fixture-marker"]');

    expect(wrapper.findAll("aside").length).toBe(1);
    expect(markers).toHaveLength(1);
  });
});
