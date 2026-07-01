// --- external

// -- components
import { IconAnimated } from "@upmind-automation/upmind-ui";
import { useSystemArgTypes } from "../../utils";
import type { Meta, StoryObj } from "@storybook/vue3";

// --- types

// -----------------------------------------------------------------------------
const meta: Meta<typeof IconAnimated> = {
  argTypes: {
    icon: {
      control: { type: "text" },
      description: "The name of the animated icon to display"
    },
    trigger: {
      control: { type: "select" },
      options: ["loop", "hover", "click", "morph", "in", "out"],
      description: "Animation trigger type"
    },
    delay: {
      control: { type: "number" },
      description: "Animation delay in milliseconds"
    },
    sequence: {
      control: { type: "text" },
      description: "Animation sequence name"
    },
    size: useSystemArgTypes.size
  },
  args: {
    icon: "loading",
    trigger: "loop",
    delay: 1000,
    size: "md"
  },
  render: args => ({
    components: { IconAnimated },
    setup() {
      return { args };
    },
    template: `<icon-animated v-bind="args"/>`
  }),
  parameters: {
    docs: {
      description: {
        component:
          "A component for displaying animated icons with Lottie animations."
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof IconAnimated>;

export const Base: Story = {};

export const WithHoverTrigger: Story = {
  args: {
    trigger: "hover"
  }
};

export const WithClickTrigger: Story = {
  args: {
    trigger: "click"
  }
};

export const LargeSize: Story = {
  args: {
    size: "lg"
  }
};

export const SmallSize: Story = {
  args: {
    size: "sm"
  }
};
