// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// --- components
import {
  UwButton,
  UwCombobox,
  UwComboboxItem,
  useCustomElement,
} from "@upmind/upwind";

useCustomElement(UwButton);
useCustomElement(UwCombobox);
useCustomElement(UwComboboxItem);

// --- utils
import { useSystemArgTypes } from "../../../utils";
import countries from "../../../utils/countries";
import { count } from "console";

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
      <uw-combobox v-bind="args" />
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
      <uw-combobox v-bind="args" v-model="args.selectedValue">
        <uw-combobox-item
          v-for="item in args.items"
          :key="item.value"
          :value="item.value"
          :label="item.label"
          :icon="item.icon"
        />
      </uw-combobox>
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
