import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { computed } from "vue";
import { map } from "lodash-es";
import { hostgridConfig } from "~/portal/config/hostgrid";
import { HOSTGRID_COMMAND_ITEMS } from "~/portal/fixtures/hostgrid.fixture";
import { MOCK_ACTION, mockActionValue } from "~/portal/mock/actions";
import { DATA_REF_ID, dataRef } from "~/portal/mock/data-refs";
import { HOSTGRID_MOCK_DATASET } from "~/portal/mock/hostgrid";
import { ACTIVE_MOCK_DATA } from "~/portal/mock/injection";
import { pillarNavItems } from "~/portal/mock/selectors";
import { MOCK_DATASET_ID, useMockData } from "~/portal/mock/store";
import { COMMAND_MODULE_ID, MENU_MODULE_ID } from "~/portal/registry";
import { resolve } from "~/portal/resolve";
import PortalFrame from "~/portal/shell/PortalFrame.vue";
import { PRIMITIVE_ID } from "~/portal/types";

/**
 * The app-shell arrangement (operator brief 2026-08-28), asserted through the
 * SHIPPED resolution path rather than by reading the config object back at
 * itself: the primary destinations run down the shell's own sidebar, the
 * topbar carries the ⌘K launcher, and no bottom bar remains — the sidebar
 * single-mounts into a drawer below `lg`, which is its mobile home.
 *
 * Paired blind with tests/app-shell-chrome.must-fail.patch.
 */
describe("hostgrid — the app shell's chrome", () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, "useRoute");
  });

  function shell() {
    Object.assign(globalThis, { useRoute: () => ({ path: "/billing" }) });
    return resolve(hostgridConfig);
  }

  it("runs the primary nav down the sidebar, and nowhere in the topbar", () => {
    const { primitives } = shell();

    const middle = primitives[PRIMITIVE_ID.SIDEBAR]?.slots.middle;
    expect(middle?.status).toBe("module");
    if (middle?.status !== "module") return;
    expect(middle.id).toBe(MENU_MODULE_ID);
    // The nav is DATA now (plan R8) — the config names the ref, and the
    // dataset's own gates decide which of the six tabs render.
    expect(middle.props?.["items"]).toEqual(
      dataRef(DATA_REF_ID.PILLAR_NAV_ITEMS)
    );

    // The centre slot the nav used to occupy carries nothing now — a config
    // that seats it in both places renders the six destinations twice.
    const topbar = primitives[PRIMITIVE_ID.TOPBAR];
    expect(topbar?.slots.centre).toBeUndefined();
  });

  it("seats the ⌘K launcher at the head of the topbar", () => {
    const left = shell().primitives[PRIMITIVE_ID.TOPBAR]?.slots.left;

    expect(left?.status).toBe("module");
    if (left?.status !== "module") return;
    expect(left.id).toBe(COMMAND_MODULE_ID);
  });

  it("ships no bottom bar — the sidebar's own drawer is the mobile home", () => {
    expect(shell().primitives[PRIMITIVE_ID.BOTTOM]).toBeUndefined();
  });

  /**
   * A `full` topbar spans BOTH shell columns (PortalFrame's
   * `FULL_BLEED_CLASS`), so it paints over the sidebar's own header and hides
   * the brand that heads it. Nothing else notices: the brand stays in the DOM,
   * in near-black, at the right coordinates — it is simply underneath an
   * opaque bar. Caught by driving the app, so it is asserted on the RENDERED
   * header rather than read back off the config.
   */
  it("keeps the topbar out of the sidebar's column, so the brand heading it stays visible", () => {
    const wrapper = mount(PortalFrame, {
      props: {
        shell: shell(),
        sidebarLabel: "Portal",
        sidebarCloseLabel: "Close navigation",
        sidebarBackLabel: "Back",
        actionPaneLabel: "Details",
        actionPaneCloseLabel: "Close details",
        actionPaneTriggerLabel: "Open details",
        skipLabel: "Skip to content"
      },
      // The topbar's notifications module reads the active dataset, which the
      // layout provides in the app (mock/injection.ts).
      global: {
        provide: {
          [ACTIVE_MOCK_DATA as symbol]: computed(() =>
            useMockData(MOCK_DATASET_ID.HOSTGRID)
          )
        }
      }
    });

    const header = wrapper.get("header");
    expect(header.classes()).not.toContain("lg:col-span-2");

    wrapper.unmount();
  });

  /**
   * The palette is authored beside the nav rather than derived from it
   * (fixtures/hostgrid.fixture.ts explains why), so this is what stops the two
   * drifting: a destination added to the nav and forgotten in the palette is
   * one a client can click but never type for.
   */
  it("offers every primary destination in the palette", () => {
    const offered = map(HOSTGRID_COMMAND_ITEMS, item => item.value);

    for (const item of pillarNavItems(HOSTGRID_MOCK_DATASET)) {
      expect(item.to).toBeDefined();
      expect(offered).toContain(
        mockActionValue(MOCK_ACTION.NAVIGATE, String(item.to))
      );
    }
  });
});
