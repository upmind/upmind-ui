// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// -- components
import { Icon } from "@upmind-automation/upmind-ui";

// --- utils
import { useSystemArgTypes } from "../../utils";

// --- types

// -----------------------------------------------------------------------------
const meta: Meta<typeof Icon> = {
  argTypes: {
    icon: useSystemArgTypes.icon,
    size: useSystemArgTypes.size,
  },
  args: {
    icon: "devices",
    size: "md",
  },
  render: args => ({
    components: { Icon },
    setup() {
      return { args };
    },
    template: `<icon v-bind="args"/>`,
  }),
  parameters: {
    docs: {
      description: {
        component: "A component for displaying icons with consistent styling.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Icon>;

export const Base: Story = {};
