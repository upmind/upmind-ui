// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// -- components
import { Icon, Avatar, Button } from "@upmind-automation/upmind-ui";

// --- utils
import { useSystemArgTypes } from "../../utils";
import { keys, isFunction } from "lodash-es";

// --- types
enum variants {
  flat = "Flat",
  outline = "Outlined",
  ghost = "Ghost",
  link = "Link",
  tonal = "Tonal",
}
// -----------------------------------------------------------------------------

const meta: Meta<typeof Button> = {
  component: Button,
  argTypes: {
    variant: {
      options: keys(variants),
      control: {
        type: "radio",
        labels: variants,
      },
    },
    size: useSystemArgTypes.size,
    color: useSystemArgTypes.color,
    iconOnly: { control: "boolean" },
  },
  args: {
    label: "A compelling call to action",
    // ---
    size: "md",
    variant: "flat",
    color: "primary",
    iconOnly: false,
    block: false,
    // ---
    loading: false,
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Base: Story = {};

export const Variants: Story = {
  parameters: {
    controls: { exclude: ["label", "variant"] },
  },
  render: args => ({
    components: { Button },
    setup() {
      return {
        args,
      };
    },
    template: `
      <section class="flex w-full flex-wrap items-center gap-2">
        <h1 class="w-full mt-0">Types/Variants</h1>
        <Button v-bind="args" variant="flat" label="Flat" />
        <Button v-bind="args" variant="outline" label="Outlined" />
        <Button v-bind="args" variant="ghost" label="Ghost" />
        <Button v-bind="args" variant="link" label="Link" />
      </section>
    `,
  }),
};

export const Slots: Story = {
  parameters: {
    controls: {
      exclude: ["label", "block", "iconOnly"],
    },
  },
  render: args => ({
    components: { Button, Avatar, Icon },
    setup() {
      return {
        args,
      };
    },
    template: `
    <section class="flex w-full flex-wrap items-center justify-start gap-2">
      <h1 class="mt-0 w-full">Slots</h1>
      <p class="mt-0 w-full">
        Buttons with all slots activated in ALL sizes<br />
      </p>

      <Button v-bind="args" label="Label Only" />

      <Button v-bind="args" icon-only label="Icon Only" label="Great Britain">
        <template #prepend>
          <Avatar icon="gb" caption="GB" />
        </template>
      </Button>

      <Button v-bind="args" label="Prepend icon">
        <template #prepend>
          <Icon icon="arrow-left" />
        </template>
      </Button>

      <Button v-bind="args" label="Append icon">
        <template #append>
          <Icon icon="arrow-right" />
        </template>
      </Button>
    </section>
    `,
  }),
};

export const SolidColorVariants: Story = {
  parameters: {
    controls: { exclude: ["label", "variant", "color"] },
  },
  render: args => ({
    components: { Button },

    setup() {
      return {
        args,
      };
    },
    template: `
      <section class="flex w-full flex-wrap items-center gap-2">
        <h1 class="w-full mt-0">Solid Color Variants</h1>
        <Button v-bind="args" variant="flat" color="base" label="Base" />
        <Button v-bind="args" variant="flat" color="primary" label="Primary" />
        <Button v-bind="args" variant="flat" color="secondary" label="Secondary" />
        <Button v-bind="args" variant="flat" color="accent" label="Accent" />
        <Button v-bind="args" variant="flat" color="promotion" label="Promotion" />
        <Button v-bind="args" variant="flat" color="destructive" label="Destructive" />
        <Button v-bind="args" variant="flat" color="success" label="Success" />
        <Button v-bind="args" variant="flat" color="info" label="Info" />
        <Button v-bind="args" variant="flat" color="error" label="Error" />
        <Button v-bind="args" variant="flat" color="warning" label="Warning" />
      </section>
    `,
  }),
};

export const outlineColorVariants: Story = {
  parameters: {
    controls: { exclude: ["label", "variant", "color"] },
  },
  render: args => ({
    components: { Button },

    setup() {
      return {
        args,
      };
    },
    template: `
      <section class="flex w-full flex-wrap items-center gap-2">
        <h1 class="w-full mt-0">Outlined Color Variants</h1>
        <Button v-bind="args" variant="outline" color="base" label="Base" />
        <Button v-bind="args" variant="outline" color="primary" label="Primary" />
        <Button v-bind="args" variant="outline" color="secondary" label="Secondary" />
        <Button v-bind="args" variant="outline" color="accent" label="Accent" />
        <Button v-bind="args" variant="outline" color="promotion" label="Promotion" />
        <Button v-bind="args" variant="outline" color="destructive" label="Destructive" />
        <Button v-bind="args" variant="outline" color="success" label="Success" />
        <Button v-bind="args" variant="outline" color="info" label="Info" />
        <Button v-bind="args" variant="outline" color="error" label="Error" />
        <Button v-bind="args" variant="outline" color="warning" label="Warning" />
      </section>
    `,
  }),
};

export const GhostColorVariants: Story = {
  parameters: {
    controls: { exclude: ["label", "variant", "color"] },
  },
  render: args => ({
    components: { Button },

    setup() {
      return {
        args,
      };
    },
    template: `
      <section class="flex w-full flex-wrap items-center gap-2">
        <h1 class="w-full mt-0">Ghost Color Variants</h1>
        <Button v-bind="args" variant="ghost" color="base" label="Base" />
        <Button v-bind="args" variant="ghost" color="primary" label="Primary" />
        <Button v-bind="args" variant="ghost" color="secondary" label="Secondary" />
        <Button v-bind="args" variant="ghost" color="accent" label="Accent" />
        <Button v-bind="args" variant="ghost" color="promotion" label="Promotion" />
        <Button v-bind="args" variant="ghost" color="destructive" label="Destructive" />
        <Button v-bind="args" variant="ghost" color="success" label="Success" />
        <Button v-bind="args" variant="ghost" color="info" label="Info" />
        <Button v-bind="args" variant="ghost" color="error" label="Error" />
        <Button v-bind="args" variant="ghost" color="warning" label="Warning" />
      </section>
    `,
  }),
};

export const LinkColorVariants: Story = {
  parameters: {
    controls: { exclude: ["label", "variant", "color"] },
  },
  render: args => ({
    components: { Button },

    setup() {
      return {
        args,
      };
    },
    template: `
      <section class="flex w-full flex-wrap items-center gap-2">
        <h1 class="w-full mt-0">Link Color Variants</h1>
        <Button v-bind="args" variant="link" color="base" label="Base" />
        <Button v-bind="args" variant="link" color="primary" label="Primary" />
        <Button v-bind="args" variant="link" color="secondary" label="Secondary" />
        <Button v-bind="args" variant="link" color="accent" label="Accent" />
        <Button v-bind="args" variant="link" color="promotion" label="Promotion" />
        <Button v-bind="args" variant="link" color="destructive" label="Destructive" />
        <Button v-bind="args" variant="link" color="success" label="Success" />
        <Button v-bind="args" variant="link" color="info" label="Info" />
        <Button v-bind="args" variant="link" color="error" label="Error" />
        <Button v-bind="args" variant="link" color="warning" label="Warning" />
      </section>
    `,
  }),
};

export const TonalColorVariants: Story = {
  parameters: {
    controls: { exclude: ["label", "variant", "color"] },
  },
  render: args => ({
    components: { Button },

    setup() {
      return {
        args,
      };
    },
    template: `
      <section class="flex w-full flex-wrap items-center gap-2">
        <h1 class="w-full mt-0">Tonal Color Variants</h1>
        <Button v-bind="args" variant="tonal" color="base" label="Base" />
        <Button v-bind="args" variant="tonal" color="primary" label="Primary" />
        <Button v-bind="args" variant="tonal" color="secondary" label="Secondary" />
        <Button v-bind="args" variant="tonal" color="accent" label="Accent" />
        <Button v-bind="args" variant="tonal" color="promotion" label="Promotion" />
        <Button v-bind="args" variant="tonal" color="destructive" label="Destructive" />
        <Button v-bind="args" variant="tonal" color="success" label="Success" />
        <Button v-bind="args" variant="tonal" color="info" label="Info" />
        <Button v-bind="args" variant="tonal" color="error" label="Error" />
        <Button v-bind="args" variant="tonal" color="warning" label="Warning" />
      </section>
    `,
  }),
};

export const DisabledColorVariants: Story = {
  parameters: {
    controls: { exclude: ["label", "color"] },
  },
  render: args => ({
    components: { Button },

    setup() {
      return { args };
    },
    template: `
      <section class="flex w-full flex-wrap items-center gap-2">
        <h1 class="w-full mt-0">Disabled Color Variants</h1>
        <Button v-bind="args" color="base" label="Base" />
        <Button v-bind="args" color="primary" label="Primary" />
        <Button v-bind="args" color="secondary" label="Secondary" />
        <Button v-bind="args" color="accent" label="Accent" />
        <Button v-bind="args" color="promotion" label="Promotion" />
        <Button v-bind="args" color="destructive" label="Destructive" />
        <Button v-bind="args" color="success" label="Success" />
        <Button v-bind="args" color="info" label="Info" />
        <Button v-bind="args" color="error" label="Error" />
        <Button v-bind="args" color="warning" label="Warning" />
      </section>
    `,
  }),
  args: {
    disabled: true,
  },
};
