// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// -- components
import { Badge } from "@upmind-automation/upmind-ui";

// --- utils
import { useSystemArgTypes } from "../../utils";
import { keys } from "lodash-es";

// --- types
enum variants {
  flat = "Flat",
  outline = "Outlined",
  tonal = "Tonal",
}
// -----------------------------------------------------------------------------

const meta: Meta<typeof Badge> = {
  component: Badge,
  argTypes: {
    variant: {
      options: keys(variants),
      control: {
        type: "radio",
        labels: variants,
      },
    },

    color: useSystemArgTypes.color,
  },
  args: {
    label: "Badge",
    // icon: undefined,
    // ---
    variant: "flat",
    color: "primary",
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Base: Story = {};

export const Variants: Story = {
  parameters: {
    controls: { exclude: ["label", "variant"] },
  },
  render: args => ({
    components: { Badge },
    setup() {
      return {
        args,
      };
    },
    template: `
      <section class="flex w-full flex-wrap items-center gap-2">
        <h1 class="w-full mt-0">Types/Variants</h1>
        <Badge v-bind="args" variant="flat" label="Flat" />
        <Badge v-bind="args" variant="outline" label="Outlined" />
        <Badge v-bind="args" variant="tonal" label="Tonal" />
      </section>
    `,
  }),
};

export const SolidColorVariants: Story = {
  parameters: {
    controls: { exclude: ["label", "variant", "color"] },
  },
  render: args => ({
    components: { Badge },
    setup() {
      return {
        args,
      };
    },
    template: `
      <section class="flex w-full flex-wrap items-center gap-2">
        <h1 class="w-full mt-0">Solid Color Variants</h1>
        <Badge v-bind="args" variant="flat" color="primary" label="Primary" />
        <Badge v-bind="args" variant="flat" color="secondary" label="Secondary" />
        <Badge v-bind="args" variant="flat" color="accent" label="Accent" />
        <Badge v-bind="args" variant="flat" color="promotion" label="Promotion" />
        <Badge v-bind="args" variant="flat" color="destructive" label="Destructive" />
        <Badge v-bind="args" variant="flat" color="base" label="Base" />
        <Badge v-bind="args" variant="flat" color="info" label="Info" />
        <Badge v-bind="args" variant="flat" color="success" label="Success" />
        <Badge v-bind="args" variant="flat" color="error" label="Error" />
        <Badge v-bind="args" variant="flat" color="warning" label="Warning" />
      </section>
    `,
  }),
};

export const OutlineColorVariants: Story = {
  parameters: {
    controls: { exclude: ["label", "variant", "color"] },
  },
  render: args => ({
    components: { Badge },
    setup() {
      return {
        args,
      };
    },
    template: `
      <section class="flex w-full flex-wrap items-center gap-2">
        <h1 class="w-full mt-0">Outline Color Variants</h1>
        <Badge v-bind="args" variant="outline" color="base" label="Base" />
        <Badge v-bind="args" variant="outline" color="primary" label="Primary" />
        <Badge v-bind="args" variant="outline" color="secondary" label="Secondary" />
        <Badge v-bind="args" variant="outline" color="accent" label="Accent" />
        <Badge v-bind="args" variant="outline" color="promotion" label="Promotion" />
        <Badge v-bind="args" variant="outline" color="destructive" label="Destructive" />
        <Badge v-bind="args" variant="outline" color="success" label="Success" />
        <Badge v-bind="args" variant="outline" color="info" label="Info" />
        <Badge v-bind="args" variant="outline" color="error" label="Error" />
        <Badge v-bind="args" variant="outline" color="warning" label="Warning" />
      </section>
    `,
  }),
};

export const TonalColorVariants: Story = {
  parameters: {
    controls: { exclude: ["label", "variant", "color"] },
  },
  render: args => ({
    components: { Badge },
    setup() {
      return {
        args,
      };
    },
    template: `
      <section class="flex w-full flex-wrap items-center gap-2">
        <h1 class="w-full mt-0">Tonal Color Variants</h1>
        <Badge v-bind="args" variant="tonal" color="base" label="Base" />
        <Badge v-bind="args" variant="tonal" color="primary" label="Primary" />
        <Badge v-bind="args" variant="tonal" color="secondary" label="Secondary" />
        <Badge v-bind="args" variant="tonal" color="accent" label="Accent" />
        <Badge v-bind="args" variant="tonal" color="promotion" label="Promotion" />
        <Badge v-bind="args" variant="tonal" color="destructive" label="Destructive" />
        <Badge v-bind="args" variant="tonal" color="success" label="Success" />
        <Badge v-bind="args" variant="tonal" color="info" label="Info" />
        <Badge v-bind="args" variant="tonal" color="error" label="Error" />
        <Badge v-bind="args" variant="tonal" color="warning" label="Warning" />
      </section>
    `,
  }),
};
