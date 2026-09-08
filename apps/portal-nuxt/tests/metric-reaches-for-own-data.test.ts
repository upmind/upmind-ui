import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import Metric from "~/portal/modules/metric/Metric.vue";

/**
 * tasks.md 5.9 — "a module reaching for data itself instead of receiving
 * it". bdd.md B7 / AC6.1: `Metric` must render exactly the `items` it is
 * handed, never its own fixture. Paired blind with
 * tests/metric-reaches-for-own-data.must-fail.patch.
 */
describe("Metric — AC6.1/AC6.5: renders the items prop, never its own fixture", () => {
  it("renders a caller-supplied item the module's own fixture module never carries", () => {
    const wrapper = mount(Metric, {
      props: {
        items: [{ label: "CALLER-METRIC-LABEL", value: "CALLER-METRIC-VALUE" }],
        emptyTitle: "No metrics yet"
      }
    });

    expect(wrapper.text()).toContain("CALLER-METRIC-LABEL");
    expect(wrapper.text()).toContain("CALLER-METRIC-VALUE");
    // The module's own fixture ships "Active services" — must never leak in
    // when a different `items` array is what was actually passed.
    expect(wrapper.text()).not.toContain("Active services");
  });
});
