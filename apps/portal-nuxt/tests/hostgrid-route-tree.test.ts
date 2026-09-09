import { describe, expect, it } from "vitest";
import { hostgridConfig } from "~/portal/config/hostgrid";
import { withDatasetCustomAreas } from "~/portal/mock/custom-pages";
import { HOSTGRID_MOCK_DATASET } from "~/portal/mock/hostgrid";
import { pillarNavItems } from "~/portal/mock/selectors";
import { resolveCatchAll } from "~/portal/routes";
import { PAGE_KEY, RESERVED_PILLAR_SEGMENT } from "~/portal/types";

/**
 * Phase A (plan §1.2, §2): the whole IA is clickable — the configured group
 * resolves through the catch-all in every position, every static page
 * position has a `pages` entry (a titled stub, never the bare fallback), and
 * every primary-nav destination lands somewhere real. Paired blind with
 * tests/hostgrid-route-tree.must-fail.patch.
 */
describe("hostgrid — the configured IA resolves end to end", () => {
  it("the group slug resolves through the product hierarchy in every position", () => {
    expect(resolveCatchAll(hostgridConfig, ["products"]).kind).toBe(
      "group-listing"
    );
    expect(
      resolveCatchAll(hostgridConfig, ["products", "prod-team"]).kind
    ).toBe("product-detail");
    expect(
      resolveCatchAll(hostgridConfig, ["products", "prod-team", "billing"]).kind
    ).toBe("product-action-area");
    expect(resolveCatchAll(hostgridConfig, ["products", "order"]).kind).toBe(
      "group-order"
    );
  });

  it("a slug the config never declares matches nothing — this shape configures no custom areas", () => {
    expect(hostgridConfig.customAreas).toEqual([]);
    expect(resolveCatchAll(hostgridConfig, ["dns"]).kind).toBe("unmatched");
    expect(resolveCatchAll(hostgridConfig, ["websites"]).kind).toBe(
      "unmatched"
    );
  });

  it("every static page position has a pages entry — no pillar route falls to the bare fallback", () => {
    for (const key of Object.values(PAGE_KEY)) {
      expect(
        hostgridConfig.pages?.[key],
        `pages entry for "${key}"`
      ).toBeDefined();
    }
  });

  /**
   * The primary nav mixes both route families: the pillars are RESERVED
   * segments served by their own pages, the rest go through the catch-all. A
   * destination that is neither is a dead tab.
   *
   * Resolved against the config the APP runs — the shape's own areas plus the
   * dataset's custom pages (`mock/custom-pages.ts`), which is what
   * `usePortalConfig` hands the catch-all now that a brand's pages are data.
   */
  it("every primary-nav destination lands on a real route", () => {
    const reserved: readonly string[] = Object.values(RESERVED_PILLAR_SEGMENT);
    const config = withDatasetCustomAreas(
      hostgridConfig,
      HOSTGRID_MOCK_DATASET
    );

    for (const item of pillarNavItems(HOSTGRID_MOCK_DATASET)) {
      const segments = (item.to ?? "").split("/").filter(Boolean);
      // The dashboard is the index route, so it has no segments at all.
      if (segments.length === 0) continue;
      if (reserved.includes(segments[0] ?? "")) continue;

      expect(
        resolveCatchAll(config, segments).kind,
        `nav item "${item.label}" (${item.to})`
      ).not.toBe("unmatched");
    }
  });
});
