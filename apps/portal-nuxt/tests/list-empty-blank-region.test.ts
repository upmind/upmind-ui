import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import ListModule from "~/portal/modules/list/List.vue";

/**
 * bdd.md B7 — "empty is a state, not a blank" / AC6.4. tasks.md 5.9's
 * negative control: "an empty array rendering a blank region". The rendered
 * consequence under test is the ABSENCE of the list container, not merely
 * the presence of the empty-state text (a forced-empty branch that still
 * mounted an empty `<ul data-slot="list">` alongside the message would be a
 * blank region with a caption, and would pass an assertion that only checked
 * the text). Paired blind with tests/list-empty-blank-region.must-fail.patch.
 */
describe("List — AC6.4: an empty array renders the Empty State, not a blank list region", () => {
  it("renders the empty-state text and no list container when items is empty", () => {
    const wrapper = mount(ListModule, {
      props: {
        variant: "compact",
        items: [],
        emptyTitle: "No services yet",
        emptyDescription: "Add a service to see it listed here."
      }
    });

    expect(wrapper.find('[data-slot="list"]').exists()).toBe(false);
    expect(wrapper.text()).toContain("No services yet");
    expect(wrapper.text()).toContain("Add a service to see it listed here.");
  });

  it("renders the populated list, not the empty state, once items arrive", () => {
    const wrapper = mount(ListModule, {
      props: {
        variant: "compact",
        items: [{ id: "1", title: "Gold Plan" }],
        emptyTitle: "No services yet"
      }
    });

    expect(wrapper.find('[data-slot="list"]').exists()).toBe(true);
    expect(wrapper.text()).not.toContain("No services yet");
  });
});
