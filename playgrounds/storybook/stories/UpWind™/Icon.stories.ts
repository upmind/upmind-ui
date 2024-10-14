// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// -- components
import { UpwIcon } from "@upmind-automation/upwind";

// --- utils
import { useSystemArgTypes } from "../../utils";

// --- types

// -----------------------------------------------------------------------------

const meta: Meta<typeof UpwIcon> = {
  component: UpwIcon,
  argTypes: {
    icon: useSystemArgTypes.icon,
    size: useSystemArgTypes.size,
  },
  args: {
    icon: "devices",
    size: "md",
  },
};

export default meta;
type Story = StoryObj<typeof UpwIcon>;

export const Base: Story = {};
