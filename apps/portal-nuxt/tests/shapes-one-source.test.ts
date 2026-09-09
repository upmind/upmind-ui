import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { computed } from "vue";
import type { PortalConfig } from "~/portal/types";
import { PORTAL_CONFIGS, PORTAL_CONFIG_ID } from "~/portal/config";
import { ROW_SURFACE } from "~/portal/content/types";
import { ACTIVE_MOCK_DATA } from "~/portal/mock/injection";
import { isMockDatasetId, useMockData } from "~/portal/mock/store";
import { BUTTON_MODULE_VARIANT } from "~/portal/modules/button/types";
import {
  BRAND_MODULE_ID,
  BUTTON_MODULE_ID,
  SPEC_MODULE_ID,
  moduleGroup,
  moduleRef
} from "~/portal/registry";
import { resolve } from "~/portal/resolve";
import PortalFrame from "~/portal/shell/PortalFrame.vue";
import { GROUP_AXIS, PRIMITIVE_ID } from "~/portal/types";

/**
 * bdd.md B8 / AC7.1 — "the same code, many products": a config, unedited,
 * resolves to a visibly different shell. Two configs are the minimum that
 * can say anything, and the app ships ONE shape now (config/index.ts,
 * 2026-08-28) — so the shipped shape is graded against the contrast shape
 * below, which is a CONFIG, resolved through the shipped `resolve()` and
 * mounted in the shipped `PortalFrame`, never a hand-rolled `ResolvedShell`.
 * A fixture of the ANSWER would prove nothing; a fixture of the INPUT is the
 * claim itself — the framework reads a config and renders what it says.
 * `content` is left off the default slot deliberately: PortalFrame renders
 * chrome only, so mixing in page content (which carries its own Banner rows
 * on every shape, per tasks.md 6.1) would contaminate the announcement-band
 * assertion below.
 */
const CONTRAST_SHAPE: PortalConfig = {
  // Topbar-led — the arrangement the shipped shape LEFT when it took the app
  // shell: its destinations ride the header row, and it fills no shell rail
  // at all.
  primitives: {
    [PRIMITIVE_ID.TOPBAR]: {
      primitive: PRIMITIVE_ID.TOPBAR,
      variant: "full",
      slots: {
        centre: moduleRef(BRAND_MODULE_ID, { props: { label: "Contrast Co" } })
      }
    }
  },
  content: {},
  groups: [],
  customAreas: []
};
function frameProps(shell: ReturnType<typeof resolve>) {
  return {
    shell,
    sidebarLabel: "Primary navigation",
    sidebarCloseLabel: "Close navigation",
    sidebarBackLabel: "Back",
    actionPaneLabel: "Site details",
    actionPaneCloseLabel: "Close",
    actionPaneTriggerLabel: "Open details",
    skipLabel: "Skip to content"
  };
}

/** Every mounted tree, so a test can unmount before its `useRoute` stub goes. */
const mounted: ReturnType<typeof mount>[] = [];

function mountShape(config: PortalConfig, datasetId?: string) {
  const shell = resolve(config);
  const wrapper = mount(PortalFrame, {
    props: frameProps(shell),
    // The layout provides the active dataset in the app (mock/injection.ts);
    // chrome modules with data refs (notifications) need it here too.
    global: {
      provide: {
        [ACTIVE_MOCK_DATA as symbol]: computed(() => {
          if (!isMockDatasetId(datasetId)) return undefined;
          return useMockData(datasetId);
        })
      }
    }
  });
  mounted.push(wrapper);
  return { shell, wrapper };
}

/** The `settings` module resolves its dialog asynchronously; the stub has to outlive it. */
function unmountAll() {
  while (mounted.length) mounted.pop()?.unmount();
}

function slotsOf(wrapper: ReturnType<typeof mount>) {
  return new Set(
    [...wrapper.html().matchAll(/data-slot="([^"]+)"/g)].map(m => m[1])
  );
}

describe("PORTAL_CONFIGS — B8: the same source resolves to a different shell per shape", () => {
  afterEach(() => {
    unmountAll();
    Reflect.deleteProperty(globalThis, "useRoute");
  });

  /**
   * Compares the FILLED SLOTS, not the primitive ids. Two shapes can declare
   * the same primitives and still be different portals — the storefront and
   * the booking shape both run a topbar, a secondary bar and a bottom nav, and
   * differ in which slots of them carry anything. Comparing ids alone made
   * that pair look identical the moment the booking shape's right pane moved
   * from the shell rail to the page aside, which changed nothing about how
   * different the two are.
   */
  function filledSlots(config: PortalConfig) {
    const { primitives } = resolve(config);
    return Object.entries(primitives)
      .flatMap(([primitiveId, primitive]) =>
        Object.keys(primitive?.slots ?? {}).map(
          slotId => `${primitiveId}.${slotId}`
        )
      )
      .sort();
  }

  it("resolves two configs to mutually different slot maps", () => {
    Object.assign(globalThis, { useRoute: () => ({ path: "/" }) });

    const shipped = filledSlots(PORTAL_CONFIGS[PORTAL_CONFIG_ID.HOSTGRID]);
    const contrast = filledSlots(CONTRAST_SHAPE);

    // Mutual difference, not mere inequality: each shape fills a slot the
    // other does not, so neither is a subset of the other.
    expect(shipped.some(slot => !contrast.includes(slot))).toBe(true);
    expect(contrast.some(slot => !shipped.includes(slot))).toBe(true);
  });

  it("the contrast shape: topbar-led, filling no shell rail at all", () => {
    Object.assign(globalThis, { useRoute: () => ({ path: "/" }) });
    const { wrapper } = mountShape(CONTRAST_SHAPE);
    const slots = slotsOf(wrapper);

    // The rail the shipped shape now fills — one config away, no code.
    expect(slots.has("shell-sidebar")).toBe(false);
    expect(wrapper.text()).toContain("Contrast Co");
    // never the shipped brand's own wordmark or its nav
    expect(wrapper.text()).not.toContain("Host·Grid");
    expect(wrapper.text()).not.toContain("Products & Services");
  });

  it("hostgrid: the app shell — legacy's primary nav down the sidebar, its section menu inset in the page", () => {
    Object.assign(globalThis, { useRoute: () => ({ path: "/billing" }) });
    const { wrapper } = mountShape(
      PORTAL_CONFIGS[PORTAL_CONFIG_ID.HOSTGRID],
      PORTAL_CONFIG_ID.HOSTGRID
    );
    const slots = slotsOf(wrapper);

    // The app shell: the PRIMARY nav runs down the shell's own rail, and the
    // pillar's section menu is the page's INSET left pane (an `inline`
    // utility, asserted in tests/legacy-menus.test.ts) — two left-hand
    // columns, both by design. No action pane, no announcement band.
    expect(slots.has("shell-sidebar")).toBe(true);
    expect(slots.has("action-pane")).toBe(false);
    expect(slots.has("announcement-bar")).toBe(false);
    // legacy's own primary-tab labels, verbatim
    expect(wrapper.text()).toContain("Products & Services");
    expect(wrapper.text()).toContain("My Account");
    expect(wrapper.text()).toContain("Place New Order");
    // never the contrast shape's own copy
    expect(wrapper.text()).not.toContain("Contrast Co");
  });
});

describe("inline utility — NP.5: the pane's occupied slots become the page aside", () => {
  afterEach(() => {
    unmountAll();
    localStorage.clear();
    Reflect.deleteProperty(globalThis, "useRoute");
  });

  /**
   * Re-pointed once more (2026-08-26): Rockzone — the shipped shape that
   * carried this pane — retired into hostgrid, which declares no utility.
   * The MECHANISM stays shipped (resolve.ts `inlineUtilityAside`), so it is
   * proven on a fixture config now: the inline utility's occupied slots
   * resolve into `content.aside` rows in slot order, groups keeping their
   * surface, header and member order.
   */
  it("resolves the inline utility primitive into the page aside, groups keeping surface and header", () => {
    const shell = resolve({
      primitives: {
        [PRIMITIVE_ID.UTILITY]: {
          primitive: PRIMITIVE_ID.UTILITY,
          variant: "inline",
          // The pane's own surface cards every generated row (types.ts
          // `UtilityConfig.surface`) — asserted on the rows below.
          surface: ROW_SURFACE.PANEL,
          slots: {
            top: moduleRef(BRAND_MODULE_ID, {
              props: { label: "Casey Fixture" }
            }),
            topmid: moduleGroup(
              GROUP_AXIS.VERTICAL,
              [
                moduleRef(SPEC_MODULE_ID, { props: {} }),
                moduleRef(BUTTON_MODULE_ID, {
                  variant: BUTTON_MODULE_VARIANT.SINGLE,
                  props: { label: "See all" }
                })
              ],
              {
                surface: ROW_SURFACE.BRAND,
                header: { title: "11 Week streak" }
              }
            ),
            bottom: moduleRef(BUTTON_MODULE_ID, {
              variant: BUTTON_MODULE_VARIANT.SINGLE,
              props: { label: "Share my profile" }
            })
          }
        }
      },
      content: {},
      groups: [],
      customAreas: []
    });

    expect(shell.primitives["utility"]?.variant).toBe("inline");

    const aside = shell.content.aside;
    expect(aside).toHaveLength(3);
    expect(JSON.stringify(aside[0]?.slots)).toContain("Casey Fixture");
    // The pane's declared surface reaches every generated row.
    expect(aside.map(row => row.surface)).toEqual([
      ROW_SURFACE.PANEL,
      ROW_SURFACE.PANEL,
      ROW_SURFACE.PANEL
    ]);

    const streak = aside[1]?.slots[0] as unknown as {
      surface?: string;
      header?: { title?: string };
      members?: ReadonlyArray<{ id: string }>;
    };
    expect(streak.surface).toBe("brand");
    expect(streak.header?.title).toBe("11 Week streak");
    expect((streak.members ?? []).map(member => member.id)).toEqual([
      "spec",
      "button"
    ]);

    expect(JSON.stringify(aside[2]?.slots)).toContain("Share my profile");
  });
});
