// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// --- components
import { UpwTabs } from "@upmind/upwind";

// --- utils
import { useSystemArgTypes } from "../../utils";

// -----------------------------------------------------------------------------

const meta: Meta<typeof UpwTabs> = {
  parameters: {
    controls: {
      exclude: ["size", "modelValue"],
    },
  },
  component: UpwTabs,
  argTypes: {
    size: useSystemArgTypes.size,
  },
  args: {
    size: "md",
    disabled: false,
    modelValue: "item4",
    tabs: [
      { id: "item1", label: "Item 1" },
      { id: "item2", label: "Item 2" },
      { id: "item3", label: "Item 3" },
      { id: "item4", label: "Item 4" },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof UpwTabs>;

// -----------------------------------------------------------------------------

export const Base: Story = {};
