import { ref } from "vue";
import { Combobox } from "@upmind-automation/upmind-ui";
import { COMBOBOX_WIDTHS, COMBOBOX_SIZES } from "@upmind-automation/upmind-ui";
import countries from "../../../utils/countries.json";
import type { Meta, StoryObj } from "@storybook/vue3";

const meta: Meta<typeof Combobox> = {
  render: args => ({
    components: { Combobox },
    setup() {
      const modelValue = ref(args.modelValue);
      return {
        args,
        modelValue
      };
    },
    template: `
      <Combobox v-bind="args" v-model="modelValue" />
    `
  }),
  argTypes: {
    width: {
      control: "select",
      options: COMBOBOX_WIDTHS
    },
    size: {
      control: "select",
      options: COMBOBOX_SIZES
    }
  },
  args: {
    label: "Select a framework",
    width: "md",
    placeholder: "Select an option",
    searchPlaceholder: "Search...",
    search: true,
    items: [
      { value: "next.js", label: "Next.js", selectedLabel: "Next.js" },
      { value: "sveltekit", label: "SvelteKit", selectedLabel: "SvelteKit" },
      { value: "nuxt", label: "Nuxt", selectedLabel: "Nuxt" },
      { value: "remix", label: "Remix", selectedLabel: "Remix" },
      { value: "astro", label: "Astro", selectedLabel: "Astro" }
    ]
  }
};

export default meta;
type Story = StoryObj<typeof Combobox>;

// -----------------------------------------------------------------------------

export const Base: Story = {};

export const Countries: Story = {
  args: {
    label: "Select a country",
    placeholder: "Select a country",
    searchPlaceholder: "Search...",
    items: Object.values(countries).map((c: any) => ({
      value: c.label,
      label: c.label,
      icon: c.prependAvatar?.name,
      selectedLabel: c.label
    })),
    width: "xl"
  }
};

export const States: Story = {
  render: args => ({
    components: { Combobox },
    setup() {
      const modelValue = ref(args.modelValue);
      return {
        args,
        modelValue
      };
    },
    template: `
      <section class="flex flex-col gap-4 max-w-sm">
        <div>
          <h3 class="text-sm-loose text-muted">Default</h3>
          <Combobox v-bind="args" v-model="modelValue" />
        </div>

        <div>
          <h3 class="text-sm-loose text-muted">Hover</h3>
          <Combobox v-bind="args" v-model="modelValue" data-hover="true" />
        </div>

        <div>
          <h3 class="text-sm-loose text-muted">Focused</h3>
          <Combobox v-bind="args" v-model="modelValue" data-focus="true" />
        </div>

        <div>
          <h3 class="text-sm-loose text-muted">Selected</h3>
          <Combobox v-bind="args" model-value="nuxt" />
        </div>
      </section>
    `
  })
};
