// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// -- components
import { UpwBadge } from "@upmind/upwind";

// --- utils
import { useSystemArgTypes } from "../../utils";
import { keys } from "lodash-es";

// --- types
enum variants {
  flat = "Flat",
  outlined = "Outlined",
  tonal = "Tonal",
}
// -----------------------------------------------------------------------------

const meta: Meta<typeof UpwBadge> = {
  component: UpwBadge,
  argTypes: {
    variant: {
      options: keys(variants),
      control: {
        type: "radio",
        labels: variants,
      },
    },

    color: useSystemArgTypes.color,
    icon: useSystemArgTypes.icon,
  },
  args: {
    label: "Badge",
    icon: undefined,
    // ---
    variant: "flat",
    color: "primary",
    // ---
    loading: false,
  },
};

export default meta;
type Story = StoryObj<typeof UpwBadge>;

export const Base: Story = {};

export const Variants: Story = {
  parameters: {
    controls: { exclude: ["label", "variant"] },
  },
  render: args => ({
    components: { UpwBadge },
    setup() {
      return {
        args,
      };
    },
    template: `
      <section class="flex w-full flex-wrap items-center gap-2">
        <h1 class="w-full mt-0">Types/Variants</h1>
        <upw-badge v-bind="args" variant="flat" label="Flat" />
        <upw-badge v-bind="args" variant="outlined" label="Outlined" />
        <upw-badge v-bind="args" variant="tonal" label="Tonal" />
      </section>
    `,
  }),
};

export const SolidColorVariants: Story = {
  parameters: {
    controls: { exclude: ["label", "variant", "color"] },
  },
  render: args => ({
    components: { UpwBadge },
    setup() {
      return {
        args,
      };
    },
    template: `
      <section class="flex w-full flex-wrap items-center gap-2">
        <h1 class="w-full mt-0">Solid Color Variants</h1>
        <upw-badge v-bind="args" variant="flat" color="primary" label="Primary" />
        <upw-badge v-bind="args" variant="flat" color="secondary" label="Secondary" />
        <upw-badge v-bind="args" variant="flat" color="accent" label="Accent" />
        <upw-badge v-bind="args" variant="flat" color="base" label="Base" />
        <upw-badge v-bind="args" variant="flat" color="info" label="Info" />
        <upw-badge v-bind="args" variant="flat" color="success" label="Success" />
        <upw-badge v-bind="args" variant="flat" color="error" label="Error" />
        <upw-badge v-bind="args" variant="flat" color="warning" label="Warning" />
      </section>
    `,
  }),
};

export const OutlinedColorVariants: Story = {
  parameters: {
    controls: { exclude: ["label", "variant", "color"] },
  },
  render: args => ({
    components: { UpwBadge },
    setup() {
      return {
        args,
      };
    },
    template: `
      <section class="flex w-full flex-wrap items-center gap-2">
        <h1 class="w-full mt-0">Outlined Color Variants</h1>
        <upw-badge v-bind="args" variant="outlined" color="primary" label="Primary" />
        <upw-badge v-bind="args" variant="outlined" color="secondary" label="Secondary" />
        <upw-badge v-bind="args" variant="outlined" color="accent" label="Accent" />
        <upw-badge v-bind="args" variant="outlined" color="base" label="Base" />
        <upw-badge v-bind="args" variant="outlined" color="info" label="Info" />
        <upw-badge v-bind="args" variant="outlined" color="success" label="Success" />
        <upw-badge v-bind="args" variant="outlined" color="error" label="Error" />
        <upw-badge v-bind="args" variant="outlined" color="warning" label="Warning" />
      </section>
    `,
  }),
};

export const TonalColorVariants: Story = {
  parameters: {
    controls: { exclude: ["label", "variant", "color"] },
  },
  render: args => ({
    components: { UpwBadge },
    setup() {
      return {
        args,
      };
    },
    template: `
      <section class="flex w-full flex-wrap items-center gap-2">
        <h1 class="w-full mt-0">Tonal Color Variants</h1>
        <upw-badge v-bind="args" variant="tonal" color="primary" label="Primary" />
        <upw-badge v-bind="args" variant="tonal" color="secondary" label="Secondary" />
        <upw-badge v-bind="args" variant="tonal" color="accent" label="Accent" />
        <upw-badge v-bind="args" variant="tonal" color="base" label="Base" />
        <upw-badge v-bind="args" variant="tonal" color="info" label="Info" />
        <upw-badge v-bind="args" variant="tonal" color="success" label="Success" />
        <upw-badge v-bind="args" variant="tonal" color="error" label="Error" />
        <upw-badge v-bind="args" variant="tonal" color="warning" label="Warning" />
      </section>
    `,
  }),
};

export const LoadingColorVariants: Story = {
  parameters: {
    controls: { exclude: ["label", "color"] },
  },
  render: args => ({
    components: { UpwBadge },
    setup() {
      return { args };
    },
    template: `
      <section class="flex w-full flex-wrap items-center gap-2">
        <h1 class="w-full mt-0">Loading Color Variants</h1>
        <upw-badge v-bind="args" color="primary" label="Primary" />
        <upw-badge v-bind="args" color="secondary" label="Secondary" />
        <upw-badge v-bind="args" color="accent" label="Accent" />
        <upw-badge v-bind="args" color="base" label="Base" />
        <upw-badge v-bind="args" color="info" label="Info" />
        <upw-badge v-bind="args" color="success" label="Success" />
        <upw-badge v-bind="args" color="error" label="Error" />
        <upw-badge v-bind="args" color="warning" label="Warning" />
      </section>
    `,
  }),
  args: {
    loading: true,
  },
};
