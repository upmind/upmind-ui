import type { Meta, StoryObj } from "@storybook/vue3";
import { UpwDropdown } from "@upmind/upwind";

const meta: Meta<typeof UpwDropdown> = {
  component: UpwDropdown,
};

export default meta;
type Story = StoryObj<typeof UpwDropdown>;

const items = {
  group1: {
    label: "Style Guide",
    // icon: "palette",
    children: [
      {
        href: "/style-guide/typography",
        label: "Typography",
        target: "_parent",
      },
      {
        href: "/style-guide/colors",
        label: "Colors",
        target: "_parent",
      },
      {
        href: "/style-guide/buttons",
        label: "Buttons",
        target: "_parent",
      },
    ],
  },
  group2: {
    label: "Other Resources",

    children: {
      account: {
        href: "",
        label: "Account settings",
        target: "_parent",
      },
      support: { href: "", label: "Support", target: "_parent" },
      license: { href: "", label: "License", target: "_parent" },
      signout: {
        href: "https://www.google.com",
        label: "Sign out",
        target: "_new",
      },
    },
  },
  alert: { icon: "cog", label: "Alert", action: () => alert("Alert!") },
};

export const TypeVariants: Story = {
  render: args => ({
    components: { UpwDropdown },
    setup() {
      return { args };
    },
    template: `
      <section class="flex w-full flex-wrap items-center gap-4">
        <h3 class="w-full">Type Variants</h3>
        <upw-dropdown v-bind="args" label="Select an option..." />
        <upw-dropdown
          v-bind="args"
          label=""
          toggle="navigation-menu-vertical"
          :toggle-rotate="false"
        />
      </section>
    `,
  }),
  args: {
    items,
  },
};

export const SizeVariants: Story = {
  render: args => ({
    components: { UpwDropdown },
    setup() {
      return { args };
    },
    template: `
      <section class="flex w-full flex-wrap items-center gap-4">
        <h3 class="w-full">Size Variants</h3>
        <upw-dropdown v-bind="args" label="Select an option..." />
        <upw-dropdown v-bind="args" size="sm" label="Select an option..." />
        <upw-dropdown v-bind="args" size="lg" label="Select an option..." />
      </section>
    `,
  }),
  args: {
    items,
  },
};
