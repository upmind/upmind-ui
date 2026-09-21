// -----------------------------------------------------------------------------
/**
 * @module tests/footer-aligns-with-page
 * @description The footer's small print starts where the page's title does.
 *
 * `ShellFooter` pads `px-4 sm:px-6` and caps nothing, while `Page` pads
 * `px-4 sm:px-6 lg:px-8` and centres inside the shape's own measure. So at `lg`
 * and wider the copyright line sat 8px further out than every heading above it,
 * and ran the full column while the content stopped at 1280.
 *
 * `PortalFrame` already shares the measure with its BARS — its own comment says
 * the logo has to align with the page title. The footer was left out of that
 * rule; it now takes the same track, as a block, because it lays out its own
 * row.
 *
 * Asserted on the rendered chrome rather than on the helper, because the bug
 * was the footer never calling the helper at all.
 *
 * The SECOND half of the fix is the row inside this track, which the layout
 * owns: at `lg` it takes `PageBody`'s two columns, so the platform's line
 * starts at the aside's left edge rather than flush against the far side.
 * jsdom computes no grid, so that half is proved in the browser, not here —
 * on `/account/profile` at 1512, the mark's left edge and the page aside's
 * both read 1160, and the copyright's and the page title's both read 288.
 */

import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { computed } from "vue";
import { hostgridConfig } from "~/portal/config/hostgrid";
import { ACTIVE_MOCK_DATA } from "~/portal/mock/injection";
import { MOCK_DATASET_ID, useMockData } from "~/portal/mock/store";
import { resolve } from "~/portal/resolve";
import PortalFrame from "~/portal/shell/PortalFrame.vue";
import { contentMeasureClass } from "~/portal/shell/variants";

function shell() {
  Object.assign(globalThis, { useRoute: () => ({ path: "/billing" }) });
  return resolve(hostgridConfig);
}

function frame() {
  const resolved = shell();
  return {
    resolved,
    wrapper: mount(PortalFrame, {
      props: {
        shell: resolved,
        sidebarLabel: "Portal",
        sidebarCloseLabel: "Close navigation",
        sidebarBackLabel: "Back",
        actionPaneLabel: "Details",
        actionPaneCloseLabel: "Close details",
        actionPaneTriggerLabel: "Open details",
        skipLabel: "Skip to content"
      },
      slots: { footer: '<p data-test-key="footer-copy">Host·Grid Ltd</p>' },
      global: {
        provide: {
          [ACTIVE_MOCK_DATA as symbol]: computed(() =>
            useMockData(MOCK_DATASET_ID.HOSTGRID)
          )
        }
      }
    })
  };
}

describe("the footer takes the page's own track", () => {
  it("wraps its content in the shape's measure, padded as the page is", () => {
    const { resolved, wrapper } = frame();
    const expected = contentMeasureClass(
      resolved.content.measure,
      resolved.content.gutter
    ).split(" ");

    const track = wrapper.get('[data-test-key="footer-copy"]').element
      .parentElement;

    expect(track).not.toBeNull();
    for (const token of expected) {
      expect(track?.className.split(" ")).toContain(token);
    }
  });

  // Two paddings on one band put the copy 8px further out than the page.
  it("leaves the padding to that track, not to the band around it", () => {
    const { wrapper } = frame();

    const band = wrapper.get("footer").classes();

    expect(band).toContain("px-0");
    expect(band).not.toContain("px-4");
  });

  // The shell draws a rule above its footer. The band is quiet enough without
  // a line cutting it off from the page it belongs to.
  it("draws no rule above itself", () => {
    const { wrapper } = frame();

    expect(wrapper.get("footer").classes()).toContain("border-t-0");
  });
});
