// --- external

// -- components
import {
  Badge,
  BADGE_COLORS,
  BADGE_VARIANTS,
  BADGE_SIZES
} from "@upmind-automation/upmind-ui";
import { first } from "lodash-es";
import type { Meta, StoryObj } from "@storybook/vue3";
import type { BadgeProps } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

const meta: Meta<typeof Badge> = {
  component: Badge,
  argTypes: {
    variant: {
      options: BADGE_VARIANTS,
      control: {
        type: "select",
        labels: BADGE_VARIANTS
      }
    },
    color: {
      options: BADGE_COLORS,
      control: {
        type: "select",
        labels: BADGE_COLORS
      }
    },
    size: {
      options: BADGE_SIZES,
      control: {
        type: "select",
        labels: BADGE_SIZES
      }
    },
    close: {
      control: {
        type: "boolean"
      }
    }
  },
  args: {
    label: "Badge",
    variant: first(BADGE_VARIANTS) as BadgeProps["variant"],
    color: first(BADGE_COLORS) as BadgeProps["color"],
    close: true
  },
  parameters: {
    docs: {
      description: {
        component:
          "A small visual indicator typically used for notifications, counts, or status."
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Base: Story = {};

export const Variants: Story = {
  args: {
    close: false
  },

  parameters: {
    controls: { exclude: ["label", "variant"] }
  },

  render: args => ({
    components: { Badge },
    setup() {
      const variants = BADGE_VARIANTS;
      const colors = BADGE_COLORS;
      const sizes = BADGE_SIZES;
      const label = "Badge";
      const icon = "plus-circle";

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
        label,
        icon
      };
    },
    template: `
        <div v-for="size in sizes" :key="size" class="flex flex-col gap-4 mb-12">

          <div class="grid gap-4 w-fit" :style="{ gridTemplateColumns: 'auto repeat(' + colors.length + ', auto)' }">
            <div class="capitalize font-semibold text-lg text-right pr-2 w-20">{{ translateSize(size) }}</div>
            <div
              v-for="color in colors"
              :key="'color-' + color"
              class="capitalize text-center text-sm flex items-end justify-center text-muted"
            >
              {{ color }}
            </div>

            <template v-for="variant in variants" :key="variant">
              <div class="capitalize text-right pr-2 text-sm flex items-center justify-end text-muted">{{ variant }}</div>
              <Badge
                v-for="color in colors"
                :key="variant + color"
                v-bind="args"
                :variant="variant"
                :color="color"
                :size="size"
                icon="sale-02"
                close
              />
            </template>
          </div>
        </div>
    `
  })
};
