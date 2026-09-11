import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import StatusBlock from "~/portal/modules/status-block/StatusBlock.vue";

/**
 * tasks.md 5.9 — "a module rendering hardcoded data instead of the data it
 * is given". bdd.md B7 / AC6.1: a module has no data of its own, so two
 * different `label` props must render two different texts. Paired blind
 * with tests/status-block-hardcoded-label.must-fail.patch.
 */
describe("StatusBlock — AC6.1: renders the label it is given, not a fixed string", () => {
  it("follows the label prop across two different values", () => {
    const first = mount(StatusBlock, { props: { label: "Active" } });
    expect(first.text()).toContain("Active");

    const second = mount(StatusBlock, {
      props: { label: "Suspended — action needed" }
    });
    expect(second.text()).toContain("Suspended — action needed");
    expect(second.text()).not.toContain("Active");
  });
});
