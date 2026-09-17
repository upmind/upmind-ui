import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { filter } from "lodash-es";
import Metric from "~/portal/modules/metric/Metric.vue";
import { METRIC_MODULE_VARIANT } from "~/portal/modules/metric/types";

/**
 * A dashboard stat tile is rounded like the panels beside it, whether or not
 * it links anywhere.
 *
 * The linked form used to be the design system's `Link`, whose cva base
 * carries `rounded-xs`. `cn()` calls bare `twMerge` with no custom-token
 * config, so `rounded-card` is invisible to the merge: BOTH radii survived and
 * the emitted CSS order picked `rounded-xs`. Every linked tile rendered at 2px
 * against the panels' 12px, and an unlinked one — a plain div — rendered at
 * 12px, so the two disagreed with each other as well.
 *
 * jsdom computes no stylesheet, so the class list is the evidence: exactly one
 * radius class, the same one on both forms.
 */

const LINKED = { label: "Total orders", value: "24", to: "/billing/orders" };
const PLAIN = { label: "Active tickets", value: "3" };

function tileClasses(item: Record<string, unknown>): string[] {
  const wrapper = mount(Metric, {
    props: {
      items: [item],
      variant: METRIC_MODULE_VARIANT.TILE,
      columns: 1,
      emptyTitle: "No activity yet"
    },
    global: { stubs: { NuxtLink: { template: "<a><slot /></a>" } } }
  });
  return wrapper.find('[data-test-key="portal-metric-tile"]').classes();
}

describe("Metric — a stat tile wears one radius, linked or not", () => {
  it.each([
    ["a tile that links somewhere", LINKED],
    ["a tile that links nowhere", PLAIN]
  ])("gives %s the card radius and no competing one", (_case, item) => {
    const classes = tileClasses(item);
    expect(classes).toContain("rounded-card");
    // The whole defect in one line: a second radius class means the merge
    // did not resolve, and the stylesheet decides which one wins.
    expect(filter(classes, name => name.startsWith("rounded-"))).toEqual([
      "rounded-card"
    ]);
  });

  it("wears the same radius whether it links or not", () => {
    const radiusOf = (item: Record<string, unknown>) =>
      filter(tileClasses(item), name => name.startsWith("rounded-"));
    expect(radiusOf(LINKED)).toEqual(radiusOf(PLAIN));
  });

  it("marks only the linked tile as something to press", () => {
    expect(tileClasses(LINKED)).toContain("cursor-pointer");
    expect(tileClasses(PLAIN)).not.toContain("cursor-pointer");
  });
});
