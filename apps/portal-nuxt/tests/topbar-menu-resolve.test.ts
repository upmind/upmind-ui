import { mount } from "@vue/test-utils";
import { LayoutDashboard } from "lucide-vue-next";
import { afterEach, describe, expect, it } from "vitest";
import type { MenuItem } from "~/portal/modules/menu/types";
import type { PortalConfig } from "~/portal/types";
import { MENU_MODULE_ID, moduleRef } from "~/portal/registry";
import { resolve } from "~/portal/resolve";
import PortalFrame from "~/portal/shell/PortalFrame.vue";
import { PRIMITIVE_ID } from "~/portal/types";

/**
 * AC3.3 / bdd.md B3 — proven here through the SHIPPED resolution path
 * (config -> resolve() -> rendered slot), not a hand-built `ResolvedSlot`.
 * tests/portal-frame.test.ts renders `fixture-marker` directly by design
 * (it carries `content`, which no topbar slot accepts — resolve() would
 * reject it there); this proves the seam that skips deliberately covers:
 * a real, registered nav-tagged module surviving resolve()'s accept-tag
 * check and landing, resolved, in a topbar slot.
 */
function frameProps(shell: ReturnType<typeof resolve>) {
  return {
    shell,
    sidebarLabel: "Primary navigation",
    sidebarCloseLabel: "Close navigation",
    skipLabel: "Skip to content"
  };
}

const ITEMS: readonly MenuItem[] = [
  { to: "/alpha", label: "Alpha Route", icon: LayoutDashboard },
  { to: "/beta", label: "Beta Route", icon: LayoutDashboard },
  { to: "/gamma", label: "Gamma Route", icon: LayoutDashboard }
];

function configWithMenuInTopbarRight(): PortalConfig {
  return {
    primitives: {
      [PRIMITIVE_ID.TOPBAR]: {
        primitive: PRIMITIVE_ID.TOPBAR,
        variant: "full",
        slots: {
          right: moduleRef(MENU_MODULE_ID, { props: { items: ITEMS } })
        }
      }
    },
    content: {},
    groups: [],
    customAreas: []
  };
}

describe("resolve() -> PortalFrame — a nav-tagged module resolves and renders in a topbar slot", () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, "useRoute");
  });

  it("accepts the menu module at topbar.right and renders its configured items, in order", () => {
    Object.assign(globalThis, { useRoute: () => ({ path: "/" }) });

    const shell = resolve(configWithMenuInTopbarRight());
    const rightSlot = shell.primitives.topbar?.slots.right;

    expect(rightSlot?.status).toBe("module");
    if (rightSlot?.status !== "module") return;
    expect(rightSlot.id).toBe(MENU_MODULE_ID);

    const wrapper = mount(PortalFrame, { props: frameProps(shell) });
    const text = wrapper.text();

    const positions = ITEMS.map(item => text.indexOf(item.label));
    positions.forEach(position => expect(position).toBeGreaterThanOrEqual(0));
    for (let i = 1; i < positions.length; i += 1) {
      expect(positions[i]).toBeGreaterThan(positions[i - 1]);
    }
  });
});
