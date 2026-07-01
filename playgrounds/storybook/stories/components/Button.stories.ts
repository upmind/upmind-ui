// --- external

// -- components
import {
  Button,
  BUTTON_VARIANTS,
  BUTTON_SIZES,
  BUTTON_ALIGNMENTS
} from "@upmind-automation/upmind-ui";
import { first } from "lodash-es";
import type { Meta, StoryObj } from "@storybook/vue3";

// -----------------------------------------------------------------------------

const meta: Meta<typeof Button> = {
  component: Button,
  argTypes: {
    variant: {
      options: BUTTON_VARIANTS,
      control: {
        type: "radio",
        labels: BUTTON_VARIANTS
      }
    },
    size: {
      options: BUTTON_SIZES,
      control: {
        type: "radio",
        labels: BUTTON_SIZES
      }
    },
    align: {
      options: BUTTON_ALIGNMENTS,
      control: {
        type: "radio",
        labels: BUTTON_ALIGNMENTS
      }
    },
    block: { control: "boolean" }
  },
  args: {
    label: "Button",
    // ---
    variant: first(BUTTON_VARIANTS),
    align: first(BUTTON_ALIGNMENTS),
    // ---
    block: false,
    loading: false,
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
type Story = StoryObj<typeof Button>;

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
    components: { Button },
    setup() {
      const sizes = ["md", "lg", "sm"];
      const label = "Button";
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
        variants: BUTTON_VARIANTS.filter(variant => variant !== "control"),
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
              v-for="variant in variants"
              :key="'column-' + variant"
              class="flex flex-col gap-2 items-center"
            >
              <span class="capitalize text-center text-sm text-muted">{{ variant }}</span>

              <!-- Normal State -->
              <Button
                v-bind="args"
                :size="size"
                :icon="icon"
                :icon-append="iconAppend"
                :variant="variant"
                :label="label"
                pill
              />

              <!-- Hover State -->
              <Button
                v-bind="args"
                :size="size"
                :icon="icon"
                :icon-append="iconAppend"
                :variant="variant"
                :label="label"
                pill
                data-hover="true"
              />

              <!-- Focused State -->
              <Button
                v-bind="args"
                :size="size"
                :icon="icon"
                :icon-append="iconAppend"
                :variant="variant"
                :label="label"
                pill
                data-focus="true"
              />

              <!-- Disabled State -->
              <Button
                v-bind="args"
                :size="size"
                :icon="icon"
                :icon-append="iconAppend"
                :variant="variant"
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

// export const Slots: Story = {
//   parameters: {
//     controls: {
//       exclude: ["label", "block", "iconOnly"]
//     }
//   },
//   render: args => ({
//     components: { Button, Avatar, Icon },
//     setup() {
//       return {
//         args
//       };
//     },
//     template: `
//     <section class="flex w-full flex-wrap items-center justify-start gap-2">
//       <h1 class="mt-0 w-full">Slots</h1>
//       <p class="mt-0 w-full">
//         Buttons with all slots activated in ALL sizes<br />
//       </p>

//       <Button v-bind="args" label="Label Only" />

//       <Button v-bind="args" icon-only label="Icon Only" label="Great Britain">
//         <template #prepend>
//           <Avatar icon="gb" caption="GB" />
//         </template>
//       </Button>

//       <Button v-bind="args" label="Prepend icon">
//         <template #prepend>
//           <Icon icon="arrow-left" />
//         </template>
//       </Button>

//       <Button v-bind="args" label="Append icon">
//         <template #append>
//           <Icon icon="arrow-right" />
//         </template>
//       </Button>
//     </section>
//     `
//   })
// };
