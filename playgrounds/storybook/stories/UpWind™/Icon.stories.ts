// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// -- components
import { UwIcon, useCustomElement } from "@upmind/upwind";
useCustomElement(UwIcon);

// --- utils
import { useSystemArgTypes } from "../../utils";

// --- types

// -----------------------------------------------------------------------------
const meta: Meta<typeof UwIcon> = {
  argTypes: {
    icon: useSystemArgTypes.icon,
    size: useSystemArgTypes.size,
  },
  args: {
    icon: "devices",
    size: "md",
  },
  render: args => ({
    setup() {
      return { args };
    },
    template: `<uw-icon v-bind="args"/>`,
  }),
};

export default meta;
type Story = StoryObj<typeof UwIcon>;

export const Base: Story = {};
