import { describe, expect, it } from "vitest";
import { find } from "lodash-es";
import type { ListModuleItem } from "~/portal/modules/list/types";
import type { MenuItem } from "~/portal/modules/menu/types";
import { areaForPath } from "~/portal/areas";
import { hostgridConfig } from "~/portal/config/hostgrid";
import {
  DATA_REF_ID,
  dataRef,
  resolveDataRefProps
} from "~/portal/mock/data-refs";
import { HOSTGRID_MOCK_DATASET } from "~/portal/mock/hostgrid";
import { HOSTGRID_MINIMAL_MOCK_DATASET } from "~/portal/mock/hostgrid-minimal";
import { pillarNavItems } from "~/portal/mock/selectors";
import { METRIC_MODULE_ID } from "~/portal/registry";
import { resolve } from "~/portal/resolve";
import { pillarForPath, resolveCatchAll } from "~/portal/routes";
import {
  PAGE_KEY,
  PORTAL_PILLAR,
  PRIMITIVE_ID,
  UTILITY_SIDE
} from "~/portal/types";

/**
 * The legacy client portal's menus, served in the folk.studio board's shape
 * (operator ruling 2026-08-26): `ClientPrimaryTabigation`'s six tabs in the
 * topbar, and each pillar's own side menu — with its sub-items' children — in
 * the sidebar. Paired blind with tests/legacy-menus.must-fail.patch.
 */

function submenu(
  dataset: typeof HOSTGRID_MOCK_DATASET,
  context: Record<string, string>
): MenuItem[] {
  return resolveDataRefProps(
    { value: dataRef(DATA_REF_ID.PILLAR_SUBMENU_ITEMS) },
    dataset,
    context
  )?.value as MenuItem[];
}

describe("the brand's order route — it resolves against its own config", () => {
  it("the store path resolves against the config's own group, not the catch-all", () => {
    expect(resolveCatchAll(hostgridConfig, ["products", "order"]).kind).toBe(
      "group-order"
    );
    // A slug the brand does not configure is nobody's group order.
    expect(
      resolveCatchAll(hostgridConfig, ["websites", "order"]).kind
    ).not.toBe("group-order");
  });
});

describe("primary nav — legacy ClientPrimaryTabigation, verbatim", () => {
  it("carries its six tabs, in its order, with its labels", () => {
    expect(
      pillarNavItems(HOSTGRID_MOCK_DATASET).map(item => item.label)
    ).toEqual([
      "Dashboard",
      "Products & Services",
      // The brand's own menu pages go here, as legacy's navigationRibbon
      // injected them — after Products & Services (gap doc X15).
      "Getting started",
      "Billing",
      "My Account",
      "Support",
      "Place New Order"
    ]);
  });
});

describe("pillarForPath — which section a route belongs to", () => {
  it("maps each pillar's paths, and no pillar for a custom area", () => {
    expect(pillarForPath(hostgridConfig, "/")).toBe(PORTAL_PILLAR.DASHBOARD);
    expect(pillarForPath(hostgridConfig, "/billing/invoices")).toBe(
      PORTAL_PILLAR.BILLING
    );
    expect(pillarForPath(hostgridConfig, "/account/security")).toBe(
      PORTAL_PILLAR.ACCOUNT
    );
    expect(pillarForPath(hostgridConfig, "/support/tickets")).toBe(
      PORTAL_PILLAR.SUPPORT
    );
    expect(pillarForPath(hostgridConfig, "/products/prod-team")).toBe(
      PORTAL_PILLAR.PRODUCTS
    );
    expect(pillarForPath(hostgridConfig, "/dns")).toBeUndefined();
  });
});

describe("side menus — each pillar's own, with its children", () => {
  it("billing carries legacy's items FLAT — the tab-era children are deliberately dropped", () => {
    const items = submenu(HOSTGRID_MOCK_DATASET, {
      pillar: PORTAL_PILLAR.BILLING
    });

    expect(items.map(item => item.label)).toEqual([
      "My orders",
      "My invoices",
      "Credit notes",
      "Payment methods",
      "Account credit",
      "Settings"
    ]);
    // Deliberate drops (operator ruling 2026-08-26): Place-new-order
    // duplicated the primary nav's own tab, and Paid/Unpaid/Credited pointed
    // at query views the invoices page already presents as its three panels.
    expect(items.every(item => (item.children ?? []).length === 0)).toBe(true);
  });

  it("account is FLAT and applies legacy's gates", () => {
    const enabled = submenu(HOSTGRID_MOCK_DATASET, {
      pillar: PORTAL_PILLAR.ACCOUNT
    });
    const gatedOff = submenu(HOSTGRID_MINIMAL_MOCK_DATASET, {
      pillar: PORTAL_PILLAR.ACCOUNT
    });

    // Affiliate's and Logs' legacy ?view= children are deliberately dropped
    // (operator ruling 2026-08-26): their pages present every panel at once.
    expect(enabled.every(item => (item.children ?? []).length === 0)).toBe(
      true
    );
    // The gates run both ways: hostgrid has notes on and is a parent, and
    // the minimal dataset is its mirror on both counts.
    expect(enabled.map(i => i.label)).toContain("Notes and secrets");
    expect(enabled.map(i => i.label)).toContain("Child accounts");
    expect(gatedOff.map(i => i.label)).not.toContain("Notes and secrets");
    expect(gatedOff.map(i => i.label)).not.toContain("Child accounts");
  });

  it("support carries My tickets with its Add child", () => {
    const items = submenu(HOSTGRID_MOCK_DATASET, {
      pillar: PORTAL_PILLAR.SUPPORT
    });
    expect(items.map(item => item.label)).toEqual(["My tickets"]);
    expect(items[0]?.children?.map(c => c.label)).toEqual(["Add"]);
  });

  it("products is DERIVED from the client's own products — legacy's view-built menu", () => {
    const items = submenu(HOSTGRID_MOCK_DATASET, {
      pillar: PORTAL_PILLAR.PRODUCTS,
      groupSlug: "products"
    });

    expect(items.map(item => item.label)).toEqual([
      "All products and services",
      "Subscriptions",
      "One-time purchases",
      "Browse by category"
    ]);
    // the categories the client actually has products in, sorted
    expect(
      find(items, { label: "Browse by category" })?.children?.map(c => c.label)
    ).toEqual(["One-time purchase", "Subscription"]);
  });

  it("the dashboard has no side menu, as legacy had none", () => {
    expect(
      submenu(HOSTGRID_MOCK_DATASET, { pillar: PORTAL_PILLAR.DASHBOARD })
    ).toEqual([]);
  });

  it("the brand declares the dashboard's sidebar away (§D8 areas)", () => {
    expect(hostgridConfig.areas?.[PORTAL_PILLAR.DASHBOARD]).toEqual({
      [PRIMITIVE_ID.UTILITY]: false
    });
  });

  // The regression this pins: PortalPageHost resolved content WITHOUT the
  // route's area, so the removed utility pane still fed the dashboard's aside
  // track (portal/areas.ts). The dashboard's aside must be its OWN declared
  // metric rail — one row, the metric module, default RIGHT — never the
  // utility's LEFT menu pane.
  it("the dashboard's aside is its own metric rail — the removed utility never leaks in", () => {
    const dashboard = resolve(hostgridConfig, {
      pageKeys: [PAGE_KEY.DASHBOARD],
      area: areaForPath(hostgridConfig, "/")
    });
    expect(dashboard.content.aside.length).toBe(1);
    const [slot] = dashboard.content.aside[0]?.slots ?? [];
    expect(slot).toMatchObject({ status: "module", id: METRIC_MODULE_ID });
    expect(dashboard.content.asideSide).toBeUndefined();

    // The contrast that keeps this non-vacuous: a pillar route keeps the
    // utility pane, on the pane's own RIGHT side.
    const billing = resolve(hostgridConfig, {
      area: areaForPath(hostgridConfig, "/billing/invoices")
    });
    expect(billing.content.aside.length).toBeGreaterThan(0);
    expect(billing.content.asideSide).toBe(UTILITY_SIDE.RIGHT);
  });
});

describe("the side menu's filters actually filter the listing", () => {
  function listing(context: Record<string, string>): ListModuleItem[] {
    return resolveDataRefProps(
      { value: dataRef(DATA_REF_ID.GROUP_PRODUCT_ITEMS) },
      HOSTGRID_MOCK_DATASET,
      context
    )?.value as ListModuleItem[];
  }

  it("type and category narrow the products shown — never decorative menu entries", () => {
    const all = listing({ groupSlug: "products" });
    const oneTime = listing({ groupSlug: "products", productType: "one-time" });
    const byCategory = listing({
      groupSlug: "products",
      category: "Subscription"
    });

    expect(all.length).toBeGreaterThan(oneTime.length);
    // The hand-authored one-time products still lead their filtered list — they
    // are the most recently acquired, and the listing opens newest-first; the
    // generated tail behind them is what gives the filter three pages to page.
    expect(oneTime.map(item => item.id).slice(0, 2)).toEqual([
      "prod-workshop",
      "prod-onboarding"
    ]);
    expect(oneTime.every(item => item.id !== "prod-analytics")).toBe(true);
    expect(byCategory.every(item => item.id !== "prod-onboarding")).toBe(true);
  });
});
