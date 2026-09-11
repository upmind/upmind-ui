import { mount } from "@vue/test-utils";
import { LayoutDashboard } from "lucide-vue-next";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { MenuItem } from "~/portal/modules/menu/types";
import Menu from "~/portal/modules/menu/Menu.vue";

const ITEMS: readonly MenuItem[] = [
  { to: "/a", label: "Alpha", icon: LayoutDashboard },
  { to: "/b", label: "Beta", icon: LayoutDashboard }
];

/**
 * AC6.1 — the `menu` module's own registered variant literal (public
 * surface: `MenuProps.variant`) must select which rendered structure
 * mounts. `default` renders a vertical rail list; `horizontal` renders
 * `@upmind/ui`'s `NavigationMenu` (design.md, tasks.md 5.1's board note).
 * Paired blind with tests/menu-horizontal-renders-vertical.must-fail.patch.
 */
describe("Menu — AC6.1: the horizontal variant renders NavigationMenu, not the vertical rail", () => {
  beforeEach(() => {
    Object.assign(globalThis, { useRoute: () => ({ path: "/" }) });
  });
  afterEach(() => {
    Reflect.deleteProperty(globalThis, "useRoute");
  });

  it("mounts a navigation-menu landmark for horizontal, and none for default", () => {
    const horizontal = mount(Menu, {
      props: { items: ITEMS, variant: "horizontal", navLabel: "Primary" }
    });
    expect(horizontal.find('[data-slot="navigation-menu"]').exists()).toBe(
      true
    );

    const vertical = mount(Menu, {
      props: { items: ITEMS, variant: "default" }
    });
    expect(vertical.find('[data-slot="navigation-menu"]').exists()).toBe(false);
  });
});
