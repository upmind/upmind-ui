// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// --- components
import { UwButton, UwCombobox, useCustomElement } from "@upmind/upwind";

useCustomElement(UwButton);
useCustomElement(UwCombobox);

// --- utils
import { useSystemArgTypes } from "../../../utils";
import countries from "../../../utils/countries";

const meta: Meta<typeof UwCombobox> = {
  parameters: {
    controls: { exclude: ["selectedValue"] },
  },
  argTypes: {
    color: useSystemArgTypes.color,
    width: useSystemArgTypes.allSizes,
  },
  args: {
    selectedValue: "",
    label: "Select a framework",
    color: "base",
    width: "md",
    items: [
      { value: "next.js", label: "Next.js" },
      { value: "sveltekit", label: "SvelteKit" },
      { value: "nuxt", label: "Nuxt" },
      { value: "remix", label: "Remix" },
      { value: "astro", label: "Astro" },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof UwCombobox>;

// -----------------------------------------------------------------------------

export const Base: Story = {
  render: args => ({
    setup() {
      return {
        args,
      };
    },
    template: `
      <uw-combobox
        v-bind="args"
        v-model="args.selectedValue"
      />
    `,
  }),
};

export const Countries: Story = {
  render: args => ({
    setup() {
      return {
        args,
      };
    },
    template: `
      <uw-combobox v-bind="args" v-model="args.selectedValue" />
    `,
  }),
  args: {
    label: "Select a country",
    items: Object.values(countries).map(c => ({
      value: c.value,
      label: c.label,
      icon: c.prependAvatar.name,
    })),
    width: "xl",
  },
};
