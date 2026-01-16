import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Accordion from "../Accordion.vue";
import AccordionItem from "../AccordionItem.vue";
import AccordionTrigger from "../AccordionTrigger.vue";
import AccordionContent from "../AccordionContent.vue";

describe("Accordion", () => {
  it("renders correctly", () => {
    const wrapper = mount(Accordion, {
      props: {
        type: "single",
        collapsible: true
      },
      slots: {
        default: `
                <AccordionItem value="item-1">
                    <AccordionTrigger>Trigger</AccordionTrigger>
                    <AccordionContent>Content</AccordionContent>
                </AccordionItem>
            `
      },
      global: {
        components: {
          AccordionItem,
          AccordionTrigger,
          AccordionContent
        }
      }
    });
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.text()).toContain("Trigger");
  });
});
