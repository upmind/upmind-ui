// --- external

// -- components
import { Icon } from "@upmind-automation/upmind-ui";
import { useSystemArgTypes } from "../../utils";
import type { Meta, StoryObj } from "@storybook/vue3";

// --- types

// -----------------------------------------------------------------------------
const meta: Meta<typeof Icon> = {
  argTypes: {
    icon: useSystemArgTypes.icon,
    size: useSystemArgTypes.size
  },
  args: {
    icon: "user",
    size: "md"
  },
  render: args => ({
    components: { Icon },
    setup() {
      return { args };
    },
    template: `<icon v-bind="args"/>`
  }),
  parameters: {
    docs: {
      description: {
        component: "A component for displaying icons with consistent styling."
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof Icon>;

export const Base: Story = {};
