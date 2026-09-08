import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import type { ResolvedShell } from "~/portal/resolve";
import { FIXTURE_MODULE_ID } from "~/portal/registry";
import PortalFrame from "~/portal/shell/PortalFrame.vue";
import { PRIMITIVE_ID } from "~/portal/types";

/**
 * bdd.md B2 — "a group renders in order, on its declared axis": a
 * three-member group renders its members in declared order along its axis,
 * and the SAME group declared on the other axis stacks them the same order
 * — proven as a rendered consequence (a container class distinguishing the
 * two axes), never by reading the `axis` prop back.
 */
function frameProps(shell: ResolvedShell) {
  return {
    shell,
    sidebarLabel: "Primary navigation",
    sidebarCloseLabel: "Close navigation",
    sidebarBackLabel: "Back",
    actionPaneLabel: "Details",
    actionPaneCloseLabel: "Close",
    actionPaneTriggerLabel: "Open details",
    skipLabel: "Skip to content"
  };
}

function groupShell(
  primitiveId: typeof PRIMITIVE_ID.TOPBAR | typeof PRIMITIVE_ID.SIDEBAR,
  slotId: string,
  axis: "horizontal" | "vertical"
): ResolvedShell {
  return {
    primitives: {
      [primitiveId]: {
        variant: primitiveId === PRIMITIVE_ID.TOPBAR ? "full" : "default",
        slots: {
          [slotId]: {
            status: "group",
            axis,
            members: [
              { status: "module", id: FIXTURE_MODULE_ID, variant: "first" },
              { status: "module", id: FIXTURE_MODULE_ID, variant: "second" },
              { status: "module", id: FIXTURE_MODULE_ID, variant: "third" }
            ]
          }
        }
      }
    },
    content: {}
  };
}

describe("PortalFrame — B2: a module group renders its members in order, on its declared axis", () => {
  it("renders a horizontal group's members in declared order, laid out on the inline axis", () => {
    const wrapper = mount(PortalFrame, {
      props: frameProps(groupShell(PRIMITIVE_ID.TOPBAR, "right", "horizontal"))
    });
    const markers = wrapper.findAll('[data-slot="portal-fixture-marker"]');
    expect(markers.map(marker => marker.text())).toEqual([
      "first",
      "second",
      "third"
    ]);

    const container = markers[0]?.element.parentElement;
    expect(container?.getAttribute("data-slot")).toBe("portal-module-group");
    const classes = container?.className ?? "";
    expect(classes).toContain("flex-row");
    expect(classes).not.toContain("flex-col");
  });

  it("renders the same group declared vertical, same order, on the block axis", () => {
    const wrapper = mount(PortalFrame, {
      props: frameProps(groupShell(PRIMITIVE_ID.SIDEBAR, "middle", "vertical"))
    });
    const markers = wrapper.findAll('[data-slot="portal-fixture-marker"]');
    expect(markers.map(marker => marker.text())).toEqual([
      "first",
      "second",
      "third"
    ]);

    const container = markers[0]?.element.parentElement;
    expect(container?.getAttribute("data-slot")).toBe("portal-module-group");
    const classes = container?.className ?? "";
    expect(classes).toContain("flex-col");
    expect(classes).not.toContain("flex-row");
  });
});
