// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// -- components
import { UwBadge, useCustomElement } from "@upmind/upwind";
useCustomElement(UwBadge);

// --- utils
import { useSystemArgTypes } from "../../utils";
import { keys } from "lodash-es";

// --- types
enum variants {
  flat = "Flat",
  outline = "Outline",
  tonal = "Tonal",
}
// -----------------------------------------------------------------------------

const meta: Meta<typeof UwBadge> = {
  argTypes: {
    variant: {
      options: keys(variants),
      control: {
        type: "radio",
        labels: variants,
      },
    },

    color: useSystemArgTypes.color,
    // icon: useSystemArgTypes.icon,
  },
  args: {
    label: "Badge",
    // icon: undefined,
    // ---
    variant: "flat",
    color: "primary",
  },
  render: args => ({
    setup() {
      return { args };
    },
    template: `<uw-badge v-bind="args"/>`,
  }),
};

export default meta;
type Story = StoryObj<typeof UwBadge>;

export const Base: Story = {};

export const Variants: Story = {
  parameters: {
    controls: { exclude: ["label", "variant"] },
  },
  render: args => ({
    setup() {
      return {
        args,
      };
    },
    template: `
      <section class="flex w-full flex-wrap items-center gap-2">
        <h1 class="w-full mt-0">Types/Variants</h1>
        <uw-badge v-bind="args" variant="flat" label="Flat" />
        <uw-badge v-bind="args" variant="outline" label="Outline" />
        <uw-badge v-bind="args" variant="tonal" label="Tonal" />
      </section>
    `,
  }),
};

export const SolidColorVariants: Story = {
  parameters: {
    controls: { exclude: ["label", "variant", "color"] },
  },
  render: args => ({
    components: { UwBadge },
    setup() {
      return {
        args,
      };
    },
    template: `
      <section class="flex w-full flex-wrap items-center gap-2">
        <h1 class="w-full mt-0">Solid Color Variants</h1>
        <uw-badge v-bind="args" variant="flat" color="primary" label="Primary" />
        <uw-badge v-bind="args" variant="flat" color="secondary" label="Secondary" />
        <uw-badge v-bind="args" variant="flat" color="accent" label="Accent" />
        <uw-badge v-bind="args" variant="flat" color="promotion" label="Promotion" />
        <uw-badge v-bind="args" variant="flat" color="destructive" label="Destructive" />
        <uw-badge v-bind="args" variant="flat" color="base" label="Base" />
        <uw-badge v-bind="args" variant="flat" color="info" label="Info" />
        <uw-badge v-bind="args" variant="flat" color="success" label="Success" />
        <uw-badge v-bind="args" variant="flat" color="error" label="Error" />
        <uw-badge v-bind="args" variant="flat" color="warning" label="Warning" />
      </section>
    `,
  }),
};

export const OutlineColorVariants: Story = {
  parameters: {
    controls: { exclude: ["label", "variant", "color"] },
  },
  render: args => ({
    components: { UwBadge },
    setup() {
      return {
        args,
      };
    },
    template: `
      <section class="flex w-full flex-wrap items-center gap-2">
        <h1 class="w-full mt-0">Outline Color Variants</h1>
        <uw-badge v-bind="args" variant="outline" color="base" label="Base" />
        <uw-badge v-bind="args" variant="outline" color="primary" label="Primary" />
        <uw-badge v-bind="args" variant="outline" color="secondary" label="Secondary" />
        <uw-badge v-bind="args" variant="outline" color="accent" label="Accent" />
        <uw-badge v-bind="args" variant="outline" color="promotion" label="Promotion" />
        <uw-badge v-bind="args" variant="outline" color="destructive" label="Destructive" />
        <uw-badge v-bind="args" variant="outline" color="success" label="Success" />
        <uw-badge v-bind="args" variant="outline" color="info" label="Info" />
        <uw-badge v-bind="args" variant="outline" color="error" label="Error" />
        <uw-badge v-bind="args" variant="outline" color="warning" label="Warning" />
      </section>
    `,
  }),
};

export const TonalColorVariants: Story = {
  parameters: {
    controls: { exclude: ["label", "variant", "color"] },
  },
  render: args => ({
    components: { UwBadge },
    setup() {
      return {
        args,
      };
    },
    template: `
      <section class="flex w-full flex-wrap items-center gap-2">
        <h1 class="w-full mt-0">Tonal Color Variants</h1>
        <uw-badge v-bind="args" variant="tonal" color="base" label="Base" />
        <uw-badge v-bind="args" variant="tonal" color="primary" label="Primary" />
        <uw-badge v-bind="args" variant="tonal" color="secondary" label="Secondary" />
        <uw-badge v-bind="args" variant="tonal" color="accent" label="Accent" />
        <uw-badge v-bind="args" variant="tonal" color="promotion" label="Promotion" />
        <uw-badge v-bind="args" variant="tonal" color="destructive" label="Destructive" />
        <uw-badge v-bind="args" variant="tonal" color="success" label="Success" />
        <uw-badge v-bind="args" variant="tonal" color="info" label="Info" />
        <uw-badge v-bind="args" variant="tonal" color="error" label="Error" />
        <uw-badge v-bind="args" variant="tonal" color="warning" label="Warning" />
      </section>
    `,
  }),
};
