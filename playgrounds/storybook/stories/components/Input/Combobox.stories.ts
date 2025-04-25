// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// --- components
import {
  Button,
  Combobox,
  type ComboboxItemProps,
} from "@upmind-automation/upmind-ui";
// --- utils
import { useSystemArgTypes } from "../../../utils";
import countries from "../../../utils/countries.json";
import { ref } from "vue";

const meta: Meta<typeof Combobox> = {
  render: args => ({
    components: { Combobox },
    setup() {
      const modelValue = ref(args.modelValue);
      return {
        args,
        modelValue,
      };
    },
    template: `
      <Combobox v-bind="args" v-model="modelValue" />
    `,
  }),
  argTypes: {
    color: useSystemArgTypes.color,
    width: useSystemArgTypes.allSizes,
  },
  args: {
    label: "Select a framework",
    color: "base",
    width: "md",
    search: true,
    items: [
      { value: "next.js", label: "Next.js", selectedLabel: "Next.js" },
      { value: "sveltekit", label: "SvelteKit", selectedLabel: "SvelteKit" },
      { value: "nuxt", label: "Nuxt", selectedLabel: "Nuxt" },
      { value: "remix", label: "Remix", selectedLabel: "Remix" },
      { value: "astro", label: "Astro", selectedLabel: "Astro" },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof Combobox>;

// -----------------------------------------------------------------------------

export const Base: Story = {
  args: {
    modelValue: "nuxt",
  },
};

export const Countries: Story = {
  args: {
    label: "Select a country",
    items: Object.values(countries).map((c: any) => ({
      value: c.label,
      label: c.label,
      icon: c.prependAvatar?.name,
      selectedLabel: c.label,
    })),
    width: "xl",
  },
};
