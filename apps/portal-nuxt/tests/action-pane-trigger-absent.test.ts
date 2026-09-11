import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
import type { ResolvedShell } from "~/portal/resolve";
import { FIXTURE_MODULE_ID } from "~/portal/registry";
import PortalFrame from "~/portal/shell/PortalFrame.vue";
import { PRIMITIVE_ID } from "~/portal/types";

/**
 * bdd.md B5 — "the pane is a column at lg+ and a drawer below": "at 390px the
 * inline pane is absent, the same content is reachable in a right drawer,
 * and a query for the pane's marker returns exactly one node at both
 * widths." action-pane-drawer-duplicate.test.ts already bounds the "not
 * twice" side; this bounds the other side of the range — the content must
 * actually be REACHABLE below lg, via a trigger, not merely absent-and-never-
 * duplicated. Paired blind with tests/action-pane-trigger-absent.must-fail.patch.
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

function stubViewport(desktop: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: desktop,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  );
}

const MARKER_SELECTOR = '[data-slot="portal-fixture-marker"]';

describe("PortalFrame — B5: the utility pane's content is reachable below lg", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
    Reflect.deleteProperty(globalThis, "useRoute");
  });

  it("composes a trigger that opens a drawer carrying the pane's content, with exactly one copy in the tree", async () => {
    Object.assign(globalThis, { useRoute: () => ({ path: "/" }) });
    stubViewport(false);

    const shell: ResolvedShell = {
      primitives: {
        [PRIMITIVE_ID.TOPBAR]: {
          variant: "inset",
          slots: {}
        },
        [PRIMITIVE_ID.UTILITY]: {
          variant: "persistent",
          slots: {
            top: {
              status: "module",
              id: FIXTURE_MODULE_ID,
              variant: "default"
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
    await nextTick();

    expect(wrapper.find("aside").exists()).toBe(false);

    const trigger = wrapper.get('[aria-label="Open details"]');
    await trigger.trigger("click");
    await nextTick();

    const dialog = document.body.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();

    const markers = document.body.querySelectorAll(MARKER_SELECTOR);
    expect(markers).toHaveLength(1);
    expect(dialog!.contains(markers[0]!)).toBe(true);

    wrapper.unmount();
  });
});
