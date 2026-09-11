import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import type { RowSurface } from "~/portal/content/types";
import PortalContent from "~/portal/content/PortalContent.vue";
import { ROW_LAYOUT, ROW_SURFACE } from "~/portal/content/types";
import { rowSurfaceClasses } from "~/portal/content/variants";
import { PAGINATION_MODULE_ID, moduleRef } from "~/portal/registry";
import { resolve } from "~/portal/resolve";

/**
 * A footer whose module renders NOTHING must show no region — the rule a
 * bare row and an empty list already follow.
 *
 * A footer's slot is assigned in CONFIG, but whether its module renders is
 * RUNTIME data: a pager on a collection that fits one page renders nothing,
 * and `Card`'s `hasFooter` reads slot PRESENCE, so the bordered padded strip
 * stood around a comment node (measured at 49px on a group listing before
 * the fix). jsdom computes no CSS, so the rendered consequence is proved in
 * a browser; what these assert is that the collapse rule reaches the footer
 * element at all — the part a regression would silently drop.
 *
 * Paired blind with tests/row-footer-empty-region.must-fail.patch.
 */
const SURFACES: readonly RowSurface[] = [
  ROW_SURFACE.SECTION,
  ROW_SURFACE.PANEL,
  ROW_SURFACE.MUTED,
  ROW_SURFACE.BRAND,
  ROW_SURFACE.INVERSE
];

describe("row footer — an empty footer region collapses", () => {
  it.each(SURFACES)("%s carries the collapse rule", surface => {
    expect(rowSurfaceClasses(surface).footer).toContain("empty:hidden");
  });

  it("lands the collapse rule on the rendered footer element", () => {
    const rows = resolve({
      primitives: {},
      content: {
        rows: [
          {
            layout: ROW_LAYOUT.FULL,
            surface: ROW_SURFACE.PANEL,
            header: { title: "Active" },
            // A pager with one page's worth of items renders nothing — the
            // exact shape a group listing hands its footer.
            footer: moduleRef(PAGINATION_MODULE_ID, {
              props: {
                state: { total: 5, itemsPerPage: 10, page: 1 },
                label: "Active pages"
              }
            }),
            slots: []
          }
        ]
      }
    }).content.rows;

    const wrapper = mount(PortalContent, { props: { rows } });
    const footer = wrapper.find('[data-slot="card-footer"]');

    expect(footer.exists()).toBe(true);
    expect(footer.classes()).toContain("empty:hidden");
    // The pager itself rendered nothing — that is what makes the region empty.
    expect(footer.find("nav").exists()).toBe(false);
  });
});
