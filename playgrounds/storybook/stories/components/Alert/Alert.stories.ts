// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// -- components
import { Alert } from "@upmind-automation/upmind-ui";

// --- utils
import { useSystemArgTypes } from "../../../utils";
import { keys } from "lodash-es";

const meta: Meta<typeof Alert> = {
  title: "Components/Alert",
  component: Alert,
  tags: ["autodocs"],
  argTypes: {
    icon: useSystemArgTypes.icon,
    variant: useSystemArgTypes.variant,
    color: useSystemArgTypes.color,
  },
  args: {
    title: "Alert",
    description:
      "This is an example alert. Use the controls to change the appearance.",
    icon: "alert-triangle",
  },
  parameters: {
    docs: {
      description: {
        component:
          "A component used to display important messages or notifications to users.",
      },
      story: {
        iframeHeight: 150,
      },
      bestPractices: {
        items: [
          "Use colors to match the message type.",
          "Keep text short, clear, and actionable. Avoid jargon.",
          "Make sure alerts work well with screen readers.",
          "Use icons that match the message type.",
          "Place alerts logically in the UI, near the related element.",
        ],
      },
      useCases: {
        items: [
          "Show success messages after actions.",
          "Display error messages when things fail.",
          "Notify users about important system info.",
          "Warn users about potential issues.",
          "Offer helpful tips or guidance.",
        ],
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Base: Story = {};

export const Colors: Story = {
  parameters: {
    controls: { exclude: ["color"] },
  },

  render: (args: any) => ({
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
