// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// --- components
import { Button, Combobox } from "@upmind-automation/upmind-ui";
// --- utils
import { useSystemArgTypes } from "../../../utils";
import countries from "../../../utils/countries.json";

const meta: Meta<typeof Combobox> = {
  render: args => ({
    components: { Combobox },
    setup() {
      return {
        args,
      };
    },
    template: `
      <combobox v-bind="args" />
    `,
  }),
  argTypes: {
    color: useSystemArgTypes.color,
    width: useSystemArgTypes.allSizes,
  },
  args: {
    modelValue: "nuxt",
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
type Story = StoryObj<typeof Combobox>;

// -----------------------------------------------------------------------------

export const Base: Story = {};

export const Countries: Story = {
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
