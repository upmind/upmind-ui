import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import type { ResolvedShell } from "~/portal/resolve";
import { FIXTURE_MODULE_ID } from "~/portal/registry";
import PortalFrame from "~/portal/shell/PortalFrame.vue";
import { PRIMITIVE_ID } from "~/portal/types";

/**
 * bdd.md B3 — "the shell renders what the config names". `PortalFrame` takes
 * an already-resolved `ResolvedShell` (design.md §D5: it "renders exactly
 * this, and nothing it was not given"), so these hand it `ResolvedSlot`
 * values directly rather than routing through `resolve()` first — neither
 * `topbar` nor `sidebar.middle` accepts the fixture module's own `content`
 * tag (design.md §D4), and that is exactly why: PortalFrame's own rendering
 * is what is under test here, never the resolver's accept-tag seam (that is
 * resolve.test.ts's job).
 */
function frameProps(shell: ResolvedShell) {
  return {
    shell,
    sidebarLabel: "Primary navigation",
    sidebarCloseLabel: "Close navigation",
    skipLabel: "Skip to content"
  };
}

const MARKER_SELECTOR = '[data-slot="portal-fixture-marker"]';

describe("PortalFrame — B3: the three topbar slots are independent", () => {
  it("renders a distinct marker per slot, as three separate regions, not one collapsed row", () => {
    const shell: ResolvedShell = {
      primitives: {
        [PRIMITIVE_ID.TOPBAR]: {
          variant: "full",
          slots: {
            left: {
              status: "module",
              id: FIXTURE_MODULE_ID,
              variant: "default"
            },
            centre: {
              status: "module",
              id: FIXTURE_MODULE_ID,
              variant: "alternate"
            },
            right: {
              status: "module",
              id: FIXTURE_MODULE_ID,
              variant: "default"
            }
          }
        }
      },
      content: {}
    };

    const wrapper = mount(PortalFrame, { props: frameProps(shell) });
    const markers = wrapper.findAll(MARKER_SELECTOR);

    // Paired blind with tests/topbar-slots-collapsed.must-fail.patch.
    expect(markers).toHaveLength(3);
    // "independent regions" (design.md §D4), not one collapsed container:
    // each marker sits under its own region, not all three siblings under
    // one shared parent.
    const parents = new Set(
      markers.map(marker => marker.element.parentElement)
    );
    expect(parents.size).toBe(3);
  });
});

describe("PortalFrame — B3: the sidebar's nav has exactly one copy in the tree", () => {
  it("mounts the middle slot's module once, not once inline and once again for the drawer", () => {
    const shell: ResolvedShell = {
      primitives: {
        [PRIMITIVE_ID.SIDEBAR]: {
          variant: "default",
          slots: {
            middle: {
              status: "module",
              id: FIXTURE_MODULE_ID,
              variant: "default"
            }
          }
        }
      },
      content: {}
    };

    const wrapper = mount(PortalFrame, { props: frameProps(shell) });
    const markers = wrapper.findAll(MARKER_SELECTOR);

    // Paired blind with tests/sidebar-mobile-duplicate-nav.must-fail.patch.
    // `ShellSidebar` (design-system) already single-mounts its `default`
    // slot — one copy inline at lg+, the SAME copy moved into the mobile
    // Sheet below it — so PortalFrame must pass the resolved slot through
    // exactly once, never render a second copy of its own "for the drawer".
    expect(markers).toHaveLength(1);
  });
});
