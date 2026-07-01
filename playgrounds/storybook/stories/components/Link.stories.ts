// --- external

// -- components
import { Link, LINK_SIZES, LINK_COLORS } from "@upmind-automation/upmind-ui";
import { first } from "lodash-es";
import type { Meta, StoryObj } from "@storybook/vue3";
import type { LinkProps } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

const meta: Meta<typeof Link> = {
  component: Link,
  argTypes: {
    color: {
      options: LINK_COLORS,
      control: {
        type: "radio",
        labels: LINK_COLORS
      }
    },
    size: {
      options: LINK_SIZES,
      control: {
        type: "radio",
        labels: LINK_SIZES
      }
    }
  },
  args: {
    label: "Link",
    // ---
    color: first(LINK_COLORS) as LinkProps["color"],
    // ---
    disabled: false
  },
  parameters: {
    docs: {
      description: {
        component:
          "An interactive control that enables user actions and form submissions."
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof Link>;

export const Base: Story = {
  parameters: {
    controls: { exclude: ["iconOnly"] }
  }
};

export const Variants: Story = {
  parameters: {
    controls: { exclude: ["label", "variant"] }
  },
  render: args => ({
    components: { Link },
    setup() {
      const sizes = ["md", "lg", "sm"];
      const label = "Link";
      const icon = "plus-circle";
      const iconAppend = "arrow-right";

      const translateSize = (size: string) => {
        switch (size) {
          case "sm":
            return "Small";
          case "md":
            return "Medium";
          case "lg":
            return "Large";
        }
      };

      return {
        args,
        color: LINK_COLORS,
        sizes,
        translateSize,
        label,
        icon,
        iconAppend
      };
    },
    template: `
        <div v-for="size in sizes" :key="size" class="flex flex-col gap-4">
          <span class="text-2xl mt-4">{{ translateSize(size) }}</span>

          <div class="flex flex-wrap gap-4 items-start">
            <div
              v-for="color in color"
              :key="'column-' + color"
              class="flex flex-col gap-2 items-center"
            >
              <span class="capitalize text-center text-sm text-muted">{{ color }}</span>

              <!-- Normal State -->
              <Link
                v-bind="args"
                :size="size"
                :icon="icon"
                :icon-append="iconAppend"
                :color="color"
                :label="label"
                pill
              />

              <!-- Hover State -->
              <Link
                v-bind="args"
                :size="size"
                :icon="icon"
                :icon-append="iconAppend"
                :color="color"
                :label="label"
                pill
                data-hover="true"
              />

              <!-- Focused State -->
              <Link
                v-bind="args"
                :size="size"
                :icon="icon"
                :icon-append="iconAppend"
                :color="color"
                :label="label"
                pill
                data-focus="true"
              />

              <!-- Disabled State -->
              <Link
                v-bind="args"
                :size="size"
                :icon="icon"
                :icon-append="iconAppend"
                :color="color"
                :label="label"
                :disabled="true"
                pill
              />
            </div>
          </div>
        </div>
    `
  })
};
