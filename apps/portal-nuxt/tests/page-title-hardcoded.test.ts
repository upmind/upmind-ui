import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Component } from "vue";
import type { PageKey } from "~/portal/types";
import { PORTAL_CONFIG_ID, PORTAL_CONFIGS } from "~/portal/config";
import { PAGE_KEY } from "~/portal/types";

/**
 * tasks.md 6.0 / ui-gaps.md F1b — every page's `<PageTitle>` must render the
 * RESOLVED content's title: the shape's `pages` entry for that position, or
 * the singular `content` fallback (OPEN-DECISION.md, settled 2026-08-26) —
 * never a title hardcoded into the page itself. The expectation is computed
 * from the CONFIG DATA per position, so a page threading the wrong keys and
 * a host hardcoding a string both go red. Paired blind with
 * tests/page-title-hardcoded.must-fail.patch.
 */

// A variable dynamic import only resolves one level deep under vite, and the
// route tree is nested now — the glob map covers every page file.
const PAGE_MODULES = import.meta.glob<{ default: Component }>(
  "../app/pages/**/*.vue"
);

/** Each mounted page file's structural position (the pageKeys it threads). */
const PAGE_POSITIONS: Readonly<Record<string, PageKey>> = {
  index: PAGE_KEY.DASHBOARD,
  "billing/orders/index": PAGE_KEY.BILLING_ORDERS,
  "billing/invoices/index": PAGE_KEY.BILLING_INVOICES,
  "billing/payment-methods": PAGE_KEY.BILLING_PAYMENT_METHODS,
  "support/tickets/index": PAGE_KEY.SUPPORT_TICKETS,
  "account/profile": PAGE_KEY.ACCOUNT_PROFILE,
  "account/security": PAGE_KEY.ACCOUNT_SECURITY
};

const PAGES = Object.keys(PAGE_POSITIONS);

function expectedTitle(
  configId: keyof typeof PORTAL_CONFIGS,
  page: string
): string | undefined {
  const config = PORTAL_CONFIGS[configId];
  const pageKey = PAGE_POSITIONS[page];
  if (pageKey === undefined) return config.content.title;
  return config.pages?.[pageKey]?.title ?? config.content.title;
}

async function mountPage(page: string, configId: string) {
  Object.assign(globalThis, {
    useRoute: () => ({
      path: page === "index" ? "/" : `/${page}`,
      query: { config: configId }
    })
  });
  vi.resetModules();
  const loader = PAGE_MODULES[`../app/pages/${page}.vue`];
  if (loader === undefined) throw new Error(`no page file for "${page}"`);
  const { default: Page } = await loader();
  return mount(Page);
}

async function mountPageTitle(page: string, configId: string) {
  const wrapper = await mountPage(page, configId);
  return wrapper.find('[data-slot="page-title"]').text();
}

describe("every page's <PageTitle> renders the resolved content's title", () => {
  afterEach(() => {
    vi.doUnmock("~/portal/config/hostgrid");
    vi.resetModules();
    Reflect.deleteProperty(globalThis, "useRoute");
  });

  // Exercised under hostgrid — heroless WITH a pages map, so each position
  // expects its own entry's title; a hardcode or wrong keys can't stay green.
  for (const page of PAGES) {
    it(`${page}.vue renders hostgrid's own title for its position`, async () => {
      const title = await mountPageTitle(page, PORTAL_CONFIG_ID.HOSTGRID);

      expect(title).toBe(expectedTitle(PORTAL_CONFIG_ID.HOSTGRID, page));
    });
  }

  it("the positions genuinely differ under hostgrid, so the loop cannot pass off one string", () => {
    const titles = new Set(
      PAGES.map(page => expectedTitle(PORTAL_CONFIG_ID.HOSTGRID, page))
    );
    expect(titles.size).toBeGreaterThan(1);
  });

  it("the same page follows the active shape — a title in the page header, a hero shape deferring to its band", async () => {
    const hostgrid = await mountPageTitle(
      "billing/orders/index",
      PORTAL_CONFIG_ID.HOSTGRID
    );
    expect(hostgrid).toBe(
      expectedTitle(PORTAL_CONFIG_ID.HOSTGRID, "billing/orders/index")
    );

    // A shape that declares a hero renders no PAGE title — the band carries
    // the h1 (PortalHero, layout-mounted, outside this mount), and a
    // page-level title would be a duplicate h1. The app ships one shape and
    // it is heroless (config/index.ts, 2026-08-28), so the hero branch is
    // reached by re-declaring the shipped shape's own content config.
    vi.resetModules();
    vi.doMock("~/portal/config/hostgrid", () => ({
      hostgridTheme: { name: "hostgrid" },
      hostgridConfig: {
        theme: "hostgrid",
        primitives: {},
        content: { title: "Host·Grid", hero: {} },
        groups: [],
        customAreas: []
      }
    }));
    const heroShape = await mountPage(
      "billing/orders/index",
      PORTAL_CONFIG_ID.HOSTGRID
    );
    expect(heroShape.find('[data-slot="page-title"]').exists()).toBe(false);
  });

  // The settled per-route dimension: hostgrid's dashboard and billing
  // entries differ.
  it("hostgrid resolves each position's pages entry — dashboard and billing differ", async () => {
    const dashboard = await mountPageTitle("index", PORTAL_CONFIG_ID.HOSTGRID);
    const billing = await mountPageTitle(
      "billing/orders/index",
      PORTAL_CONFIG_ID.HOSTGRID
    );

    expect(dashboard).toBe("Overview");
    expect(billing).toBe("Orders");
  });
});
