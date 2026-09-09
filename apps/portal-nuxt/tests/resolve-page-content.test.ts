import { describe, expect, it } from "vitest";
import type { ContentConfig, PortalConfig } from "~/portal/types";
import { hostgridConfig } from "~/portal/config/hostgrid";
import { resolve } from "~/portal/resolve";
import { PAGE_KEY } from "~/portal/types";

/**
 * The `pages` map (OPEN-DECISION.md, settled 2026-08-26): a page's candidate
 * keys resolve most-specific-first against `config.pages`, and no match — or
 * no `pageKeys` at all — falls back to the singular `content`. Paired blind
 * with tests/resolve-page-content.must-fail.patch.
 */

const FALLBACK: ContentConfig = { title: "Fallback" };
const DASHBOARD: ContentConfig = { title: "Dashboard" };
const AREA_GENERIC: ContentConfig = { title: "Any area" };
const AREA_BILLING: ContentConfig = { title: "Billing area" };

function configWith(pages: PortalConfig["pages"]): PortalConfig {
  return {
    primitives: {},
    content: FALLBACK,
    pages,
    groups: [],
    customAreas: []
  };
}

describe("resolve — a page entry inherits the shape's page shell", () => {
  const SHELL: ContentConfig = {
    title: "Brand",
    measure: "wide",
    gutter: "outside"
  };

  function shapeWith(pages: PortalConfig["pages"]): PortalConfig {
    return {
      primitives: {},
      content: SHELL,
      pages,
      groups: [],
      customAreas: []
    };
  }

  it("a page entry that states no measure inherits the shape's, rather than falling to the container default", () => {
    const config = shapeWith({ [PAGE_KEY.DASHBOARD]: { title: "Overview" } });

    const { content } = resolve(config, { pageKeys: [PAGE_KEY.DASHBOARD] });

    expect(content.title).toBe("Overview");
    expect(content.measure).toBe("wide");
    expect(content.gutter).toBe("outside");
  });

  it("the chrome — which resolves with no page key at all — reads the same measure the page does", () => {
    const config = shapeWith({ [PAGE_KEY.DASHBOARD]: { title: "Overview" } });

    const chrome = resolve(config);
    const page = resolve(config, { pageKeys: [PAGE_KEY.DASHBOARD] });

    expect(chrome.content.measure).toBe(page.content.measure);
  });

  it("an entry's own value still wins over the shape's", () => {
    const config = shapeWith({
      [PAGE_KEY.DASHBOARD]: { title: "Overview", measure: "reading" }
    });

    const { content } = resolve(config, { pageKeys: [PAGE_KEY.DASHBOARD] });

    expect(content.measure).toBe("reading");
  });

  it("an explicitly undefined field does not erase the shape's value", () => {
    const config = shapeWith({
      [PAGE_KEY.DASHBOARD]: { title: "Overview", measure: undefined }
    });

    const { content } = resolve(config, { pageKeys: [PAGE_KEY.DASHBOARD] });

    expect(content.measure).toBe("wide");
  });
});

describe("resolve — the pages map picks a page's own content", () => {
  it("a page key with an entry resolves that entry, not the fallback", () => {
    const config = configWith({ [PAGE_KEY.DASHBOARD]: DASHBOARD });

    const { content } = resolve(config, { pageKeys: [PAGE_KEY.DASHBOARD] });

    expect(content.title).toBe("Dashboard");
  });

  it("candidate order is most-specific-first: the exact area key beats the generic one", () => {
    const config = configWith({
      [PAGE_KEY.PRODUCT_AREA]: AREA_GENERIC,
      "product-area/billing": AREA_BILLING
    });

    const specific = resolve(config, {
      pageKeys: ["product-area/billing", PAGE_KEY.PRODUCT_AREA]
    });
    const generic = resolve(config, {
      pageKeys: ["product-area/tickets", PAGE_KEY.PRODUCT_AREA]
    });

    expect(specific.content.title).toBe("Billing area");
    expect(generic.content.title).toBe("Any area");
  });

  it("a key with no entry — and absent pageKeys — both fall back to the singular content", () => {
    const config = configWith({ [PAGE_KEY.DASHBOARD]: DASHBOARD });

    expect(
      resolve(config, { pageKeys: [PAGE_KEY.BILLING_INVOICES] }).content.title
    ).toBe("Fallback");
    expect(resolve(config).content.title).toBe("Fallback");
  });

  it("a config with no pages map behaves exactly as before the map existed", () => {
    const config = configWith(undefined);

    expect(
      resolve(config, { pageKeys: [PAGE_KEY.DASHBOARD] }).content.title
    ).toBe("Fallback");
  });

  it("hostgrid: the dashboard entry carries the board's rows; the fallback carries none", () => {
    const dashboard = resolve(hostgridConfig, {
      pageKeys: [PAGE_KEY.DASHBOARD]
    });
    const fallback = resolve(hostgridConfig);

    expect(dashboard.content.title).toBe("Overview");
    expect(dashboard.content.rows.length).toBeGreaterThan(0);
    expect(fallback.content.title).toBe("Host·Grid");
    expect(fallback.content.rows).toHaveLength(0);
  });
});
