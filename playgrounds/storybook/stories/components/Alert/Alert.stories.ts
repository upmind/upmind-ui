// --- external

// -- components
import {
  Alert,
  ALERT_VARIANTS,
  ALERT_COLORS,
  ALERT_SIZES
} from "@upmind-automation/upmind-ui";
import { useSystemArgTypes } from "../../../utils";
import type { Meta, StoryObj } from "@storybook/vue3";

const meta: Meta<typeof Alert> = {
  title: "Components/Alert",
  component: Alert,
  tags: ["autodocs"],
  argTypes: {
    icon: useSystemArgTypes.icon,
    variant: {
      options: ALERT_VARIANTS,
      control: {
        type: "select",
        labels: ALERT_VARIANTS
      }
    },
    color: {
      options: ALERT_COLORS,
      control: {
        type: "select",
        labels: ALERT_COLORS
      }
    },
    size: {
      options: ALERT_SIZES,
      control: {
        type: "select",
        labels: ALERT_SIZES
      }
    }
  },
  args: {
    title: "Alert",
    description:
      "This is an example alert. Use the controls to change the appearance.",
    icon: "alert-octagon",
    variant: "minimal",
    color: "neutral",
    size: "md"
  },
  parameters: {
    docs: {
      description: {
        component:
          "A component used to display important messages or notifications to users."
      },
      story: {
        iframeHeight: 150
      },
      bestPractices: {
        items: [
          "Use colors to match the message type.",
          "Keep text short, clear, and actionable. Avoid jargon.",
          "Make sure alerts work well with screen readers.",
          "Use icons that match the message type.",
          "Place alerts logically in the UI, near the related element."
        ]
      },
      useCases: {
        items: [
          "Show success messages after actions.",
          "Display error messages when things fail.",
          "Notify users about important system info.",
          "Warn users about potential issues.",
          "Offer helpful tips or guidance."
        ]
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Base: Story = {};

export const Variants: Story = {
  parameters: {
    controls: { exclude: ["title", "description", "variant"] }
  },
  render: args => ({
    components: { Alert },
    setup() {
      const variants = ALERT_VARIANTS;
      const colors = ALERT_COLORS;
      const sizes = ALERT_SIZES;
      const action = "Action";

      const translateSize = (size: string) => {
        switch (size) {
          case "sm":
            return "Small";
          case "md":
            return "Medium";
        }
      };

      return {
        args,
        variants,
        colors,
        sizes,
        translateSize,
        action
      };
    },
    template: `
        <div v-for="size in sizes" :key="size" class="flex flex-col gap-4 mb-12">

          <div class="grid gap-6 grid-cols-[auto_repeat(2,1fr)]">
            <div class="capitalize font-semibold text-lg text-right pr-2 w-20">{{ translateSize(size) }}</div>
            <div
              v-for="variant in variants"
              :key="'variant-' + variant"
              class="capitalize text-center text-sm flex items-end justify-center text-muted"
            >
              {{ variant }}
            </div>

            <template v-for="color in colors" :key="color">
              <div class="capitalize text-right pr-2 text-sm flex items-center justify-end text-muted">{{ color }}</div>
              <Alert
                v-for="variant in variants"
                :key="color + variant"
                v-bind="args"
                :variant="variant"
                :color="color"
                :size="size"
                :action="action"
                title="Message title"
                description="This is some message sub text."
              />
            </template>
          </div>
        </div>
    `
  })
};
