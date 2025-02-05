// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// -- components
import { Alert } from "@upmind-automation/upmind-ui";

// --- utils
import { useSystemArgTypes } from "../../utils";
import { keys } from "lodash-es";

// --- types
enum variants {
  outline = "Outlined",
  solid = "Solid",
}

const meta: Meta<typeof Alert> = {
  component: Alert,
  argTypes: {
    variant: {
      options: keys(variants),
      control: {
        type: "radio",
        labels: variants,
      },
    },
    icon: useSystemArgTypes.icon,
    color: useSystemArgTypes.color,
  },
  args: {
    title: "Alert",
    description:
      "This is an example alert. Use the controls to change the apperance.",
    variant: "outline",
    icon: "alert-triangle",
  },
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Base: Story = {};

export const Colors: Story = {
  parameters: {
    controls: { exclude: ["color"] },
  },
  render: args => ({
    components: { Alert },
    setup() {
      const colors = useSystemArgTypes.color;
      return {
        args,
        colors,
      };
    },
    template: `
      <div
        v-for="color in colors.options"
        :key="color"
        class="my-6"
      >
        <Alert
          v-bind="args"
          :color="color"
        />
      </div>
    `,
  }),
};
