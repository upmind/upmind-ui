import { describe, expect, it } from "vitest";
import { get } from "lodash-es";
import { areaForPath } from "~/portal/areas";
import { hostgridConfig } from "~/portal/config/hostgrid";
import { resolve } from "~/portal/resolve";
import { isDetailRoute } from "~/portal/routes";
import { PAGE_KEY, PRIMITIVE_ID } from "~/portal/types";

/**
 * A page ABOUT one entity carries no pillar rail, and carries a way back.
 *
 * The rail navigates the SECTION, so on a product's own page it offered the
 * group's sibling filters ("All products and services", "Subscriptions", …)
 * that nobody asked for, and held a side track open that narrowed the page for
 * nothing. A ticket thread had the same rail and NO back control at all — no
 * breadcrumb, no link, nothing but the browser button.
 *
 * The two halves are tested together because either alone is a regression: a
 * route that loses its rail and gains no back link is a dead end, and a back
 * link beside the rail is the duplication this replaced.
 */

/** Every route that is about ONE thing. */
const DETAIL_PATHS: readonly string[] = [
  "/products/prod-mail",
  "/products/prod-mail/overview",
  "/products/prod-mail/billing",
  "/products/prod-mail/tickets",
  "/products/prod-mail/settings",
  "/products/prod-mail/delegates",
  "/support/tickets/tkt-211"
];

/**
 * Every route that is about a SECTION, and keeps its rail. The two ticket
 * entries are the boundary this gets wrong most easily: the listing above a
 * thread, and the compose form that sits at a thread-shaped path.
 */
const SECTION_PATHS: readonly string[] = [
  "/",
  "/products",
  "/products/order",
  "/support",
  "/support/tickets",
  "/support/tickets/new",
  "/account",
  "/account/profile",
  "/billing",
  "/billing/invoices"
];

describe("isDetailRoute names the pages that are about one entity", () => {
  it.each(DETAIL_PATHS)("reads %s as a detail route", path => {
    expect(isDetailRoute(hostgridConfig, path)).toBe(true);
  });

  it.each(SECTION_PATHS)("leaves %s a section route", path => {
    expect(isDetailRoute(hostgridConfig, path)).toBe(false);
  });
});

describe("a detail route serves no pillar rail", () => {
  // Through `resolve`, not by reading the override object: the chrome and the
  // page host both resolve the SAME area, and it is the RESOLVED utility that
  // decides whether the aside track is held open.
  const utilityOf = (path: string) =>
    get(
      resolve(hostgridConfig, { area: areaForPath(hostgridConfig, path) })
        .primitives,
      PRIMITIVE_ID.UTILITY
    );

  it.each(DETAIL_PATHS)("resolves no utility pane on %s", path => {
    expect(utilityOf(path)).toBeUndefined();
  });

  it.each(SECTION_PATHS.slice(1))("keeps the pane on %s", path => {
    expect(utilityOf(path)).toBeDefined();
  });

  it("leaves the dashboard as the shape already declared it", () => {
    // The shape removes the pane here itself; the detail branch must not be
    // what does it, or the test above would pass for the wrong reason.
    expect(isDetailRoute(hostgridConfig, "/")).toBe(false);
    expect(utilityOf("/")).toBeUndefined();
  });
});

describe("a detail page carries the way back the rail used to be", () => {
  const breadcrumbOf = (pageKey: string) =>
    resolve(hostgridConfig, { pageKeys: [pageKey] }).content.breadcrumb;

  it.each([
    PAGE_KEY.PRODUCT_DETAIL,
    "product-area/overview",
    "product-area/setup",
    "product-area/billing",
    "product-area/tickets",
    "product-area/settings",
    "product-area/delegates",
    PAGE_KEY.PRODUCT_AREA
  ])("heads %s with a back link", pageKey => {
    expect(breadcrumbOf(pageKey)).toBeDefined();
  });

  it("heads a ticket thread with a back link to the listing", () => {
    expect(breadcrumbOf(PAGE_KEY.SUPPORT_TICKET_DETAIL)).toBeDefined();
  });

  it("leaves a section page with no back link — its rail is the way out", () => {
    expect(breadcrumbOf(PAGE_KEY.GROUP_LISTING)).toBeUndefined();
    expect(breadcrumbOf(PAGE_KEY.SUPPORT_TICKETS)).toBeUndefined();
    expect(breadcrumbOf(PAGE_KEY.DASHBOARD)).toBeUndefined();
  });
});
