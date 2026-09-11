import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import MenuModule from "~/portal/modules/menu/Menu.vue";

/**
 * A menu owns only the query keys ITS OWN destinations pin. A bare
 * destination yields to a filter the menu offers ("All products" goes quiet
 * while `?type=` applies), but a key no item mentions belongs to another
 * control — a listing's own status tab — and must leave the menu's selection
 * standing.
 *
 * The regression this pins: the check was `isEmpty(route.query)`, so ANY
 * query at all unselected every bare item. Adding the products listing's
 * `?status=` tab blanked the whole side menu the moment a tab was picked.
 *
 * Paired blind with tests/menu-active-unowned-query.must-fail.patch.
 */
const ITEMS = [
  { label: "All products and services", to: "/products" },
  { label: "Subscriptions", to: "/products?type=subscription" }
];

function mountMenu(path: string, query: Record<string, string>) {
  Object.assign(globalThis, { useRoute: () => ({ path, query }) });
  return mount(MenuModule, {
    props: { items: ITEMS, navLabel: "Products" },
    global: { stubs: { NuxtLink: { template: "<a><slot /></a>" } } }
  });
}

/** `SidebarNavLink` marks the active destination with `aria-current="page"`. */
function activeLabels(wrapper: ReturnType<typeof mountMenu>): string[] {
  return wrapper
    .findAll('[aria-current="page"]')
    .map(link => link.text().trim());
}

describe("menu — a query key the menu does not own leaves its selection alone", () => {
  beforeEach(() => {
    Object.assign(globalThis, { useRoute: () => ({ path: "/", query: {} }) });
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, "useRoute");
  });

  it("keeps the bare item selected under an unowned query (the status tab)", () => {
    const wrapper = mountMenu("/products", { status: "cancelled" });

    expect(activeLabels(wrapper)).toEqual(["All products and services"]);
  });

  it("still yields the bare item to a filter the menu DOES own", () => {
    const wrapper = mountMenu("/products", { type: "subscription" });

    expect(activeLabels(wrapper)).toEqual(["Subscriptions"]);
  });

  it("selects the bare item when no query applies at all", () => {
    const wrapper = mountMenu("/products", {});

    expect(activeLabels(wrapper)).toEqual(["All products and services"]);
  });
});
