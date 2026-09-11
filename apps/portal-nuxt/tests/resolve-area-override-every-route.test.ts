import { describe, expect, it } from "vitest";
import type { PortalConfig } from "~/portal/types";
import { PRODUCT_HIERARCHY_AREA_OVERRIDE } from "~/portal/config/areas/product-hierarchy";
import { MENU_MODULE_ID, moduleRef } from "~/portal/registry";
import { resolve } from "~/portal/resolve";
import { defineProductGroup, isNestedProductArea } from "~/portal/routes";
import { PRIMITIVE_ID } from "~/portal/types";

/**
 * tasks.md 6.4/6.7, AC7.3, bdd.md B8's second scenario — an area override
 * reaches its own routes and NO others. `isNestedProductArea` is the real
 * gate a route's resolution must consult before layering
 * `PRODUCT_HIERARCHY_AREA_OVERRIDE` onto `resolve()`; this exercises that
 * exact composition, never a hand-rolled "is this the area" stand-in.
 * Paired blind with tests/resolve-area-override-every-route.must-fail.patch.
 *
 * Ran against the shipped hosting config until that shape's removal
 * (2026-08-25, "we will do hosting when we are ready"); the group/override
 * machinery stays, graded against this hosting-shaped FIXTURE — a sidebar
 * menu and two product groups — until the brand returns.
 */
const SIDEBAR_ITEMS = [
  { to: "/", label: "Dashboard" },
  { to: "/websites", label: "Websites" },
  { to: "/services", label: "Services" },
  { to: "/domains", label: "Domains" },
  { to: "/billing", label: "Billing" },
  { to: "/support", label: "Support" }
];

const hostingLikeConfig: PortalConfig = {
  primitives: {
    [PRIMITIVE_ID.SIDEBAR]: {
      primitive: PRIMITIVE_ID.SIDEBAR,
      slots: {
        middle: moduleRef(MENU_MODULE_ID, { props: { items: SIDEBAR_ITEMS } })
      }
    }
  },
  content: {},
  groups: [
    defineProductGroup({ slug: "websites", label: "Websites" }),
    defineProductGroup({ slug: "domains", label: "Domains" })
  ],
  customAreas: []
};

function resolveForRoute(path: string) {
  const area = isNestedProductArea(hostingLikeConfig, path)
    ? PRODUCT_HIERARCHY_AREA_OVERRIDE
    : undefined;
  return resolve(hostingLikeConfig, area && { area });
}

function sidebarMenuItems(shell: ReturnType<typeof resolve>) {
  const middle = shell.primitives.sidebar?.slots.middle;
  if (middle === undefined || "axis" in middle) return undefined;
  return middle.props?.items;
}

const BASE_MENU_ITEM_COUNT = 6;
const OVERRIDE_MENU_ITEM_COUNT = 2;

describe("area override — reaches a route inside the product hierarchy area", () => {
  it.each(["/websites/pkg-1", "/websites/pkg-1/billing", "/domains/acme"])(
    "%s: the sidebar carries the override's own quick-jump menu",
    path => {
      const shell = resolveForRoute(path);

      expect(sidebarMenuItems(shell)).toHaveLength(OVERRIDE_MENU_ITEM_COUNT);
    }
  );
});

describe("area override — leaves every OTHER route on the base config's sidebar", () => {
  it.each([
    ["/", "the dashboard root"],
    ["/billing", "an unrelated top-level route"],
    ["/websites", "the group's own listing root — nested-product, not"],
    [
      "/billing/invoice-123",
      "a multi-segment path whose head is not a configured product group"
    ],
    ["/not-a-group/thing", "a multi-segment path matching no group at all"]
  ])("%s (%s): the base sidebar stands", path => {
    const shell = resolveForRoute(path);

    expect(sidebarMenuItems(shell)).toHaveLength(BASE_MENU_ITEM_COUNT);
  });

  it("the group-listing root and a nested product path resolve to DIFFERENT sidebars, though both start with /websites", () => {
    const groupRoot = resolveForRoute("/websites");
    const nested = resolveForRoute("/websites/pkg-1");

    expect(sidebarMenuItems(groupRoot)).not.toEqual(sidebarMenuItems(nested));
  });
});
