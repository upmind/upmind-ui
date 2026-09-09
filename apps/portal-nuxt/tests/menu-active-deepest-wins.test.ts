import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import MenuModule from "~/portal/modules/menu/Menu.vue";

/**
 * One route, one selected destination. Legacy's primary nav carries both
 * "/products" and "/products/order", so a plain prefix match lights BOTH the
 * moment a client opens the order page — the section tab and the action that
 * lives under it, at once.
 *
 * The rule: a destination yields to any sibling in the same menu that covers
 * MORE of the route. Matching stays on segment boundaries, so "/products"
 * never covers "/products-archive".
 *
 * Paired blind with tests/menu-active-deepest-wins.must-fail.patch.
 */
const ITEMS = [
  { label: "Dashboard", to: "/" },
  { label: "Products & Services", to: "/products" },
  { label: "Place New Order", to: "/products/order" },
  { label: "Products archive", to: "/products-archive" }
];

function mountMenu(path: string) {
  Object.assign(globalThis, { useRoute: () => ({ path, query: {} }) });
  return mount(MenuModule, {
    props: { items: ITEMS, navLabel: "Client portal navigation" },
    global: { stubs: { NuxtLink: { template: "<a><slot /></a>" } } }
  });
}

/** `SidebarNavLink` marks the active destination with `aria-current="page"`. */
function activeLabels(wrapper: ReturnType<typeof mountMenu>): string[] {
  return wrapper
    .findAll('[aria-current="page"]')
    .map(link => link.text().trim());
}

describe("menu — the deepest destination owns the selection", () => {
  beforeEach(() => {
    Object.assign(globalThis, { useRoute: () => ({ path: "/", query: {} }) });
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, "useRoute");
  });

  it("selects only the order action on its own route, not the section above it", () => {
    expect(activeLabels(mountMenu("/products/order"))).toEqual([
      "Place New Order"
    ]);
  });

  it("keeps the section selected on a route the action does not cover", () => {
    expect(activeLabels(mountMenu("/products/prod-team"))).toEqual([
      "Products & Services"
    ]);
  });

  it("selects the section on its own root", () => {
    expect(activeLabels(mountMenu("/products"))).toEqual([
      "Products & Services"
    ]);
  });

  /** Text prefixes are not path prefixes — the boundary is the separator. */
  it("never lets one destination bleed into a sibling that merely starts the same", () => {
    expect(activeLabels(mountMenu("/products-archive"))).toEqual([
      "Products archive"
    ]);
  });

  it("keeps the dashboard to its own route", () => {
    expect(activeLabels(mountMenu("/"))).toEqual(["Dashboard"]);
  });
});
