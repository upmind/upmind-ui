import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Collapsible from "../Collapsible.vue";
import CollapsibleTrigger from "../CollapsibleTrigger.vue";
import CollapsibleContent from "../CollapsibleContent.vue";

describe("Collapsible", () => {
  it("renders correctly", () => {
    const wrapper = mount(Collapsible, {
      slots: {
        default: `
                <CollapsibleTrigger>Trigger</CollapsibleTrigger>
                <CollapsibleContent>Content</CollapsibleContent>
            `
      },
      global: {
        components: {
          CollapsibleTrigger,
          CollapsibleContent
        }
      }
    });
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.text()).toContain("Trigger");
  });
});
