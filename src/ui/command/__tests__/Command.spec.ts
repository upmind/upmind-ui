import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Command from "../Command.vue";
import CommandInput from "../CommandInput.vue";
import CommandList from "../CommandList.vue";
import CommandEmpty from "../CommandEmpty.vue";

describe("Command", () => {
  it("renders correctly", () => {
    const wrapper = mount(Command, {
      slots: {
        default: `
                <CommandInput placeholder="Type a command..." />
                <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                </CommandList>
            `
      },
      global: {
        components: {
          CommandInput,
          CommandList,
          CommandEmpty
        }
      }
    });
    expect(wrapper.exists()).toBe(true);
  });
});
