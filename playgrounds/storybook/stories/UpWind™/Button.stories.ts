// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// -- components
import { UpwButton } from "@upmind-automation/upwind";

// --- utils
import { useSystemArgTypes } from "../../utils";
import { keys } from "lodash-es";

// --- types
enum variants {
  flat = "Flat",
  outlined = "Outlined",
  ghost = "Ghost",
  link = "Link",
}
// -----------------------------------------------------------------------------

const meta: Meta<typeof UpwButton> = {
  component: UpwButton,
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
    prependAvatar: {
      ...useSystemArgTypes.flag,
      if: { arg: "iconOnly", truthy: false },
    },
    prependIcon: useSystemArgTypes.icon,
    appendIcon: {
      ...useSystemArgTypes.icon,
      if: { arg: "iconOnly", truthy: false },
    },
    appendAvatar: {
      ...useSystemArgTypes.flag,
      if: { arg: "iconOnly", truthy: false },
    },

    iconOnly: { control: "boolean", if: { arg: "prependIcon" } },
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
    prependAvatar: undefined,
    prependIcon: undefined,
    appendIcon: undefined,
    appendAvatar: undefined,
    // ---
    loading: false,
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<typeof UpwButton>;

export const Base: Story = {};

export const Variants: Story = {
  parameters: {
    controls: { exclude: ["label", "variant"] },
  },
  render: args => ({
    components: { UpwButton },
    setup() {
      return {
        args,
      };
    },
    template: `
      <section class="flex w-full flex-wrap items-center gap-2">
        <h1 class="w-full mt-0">Types/Variants</h1>
        <upw-button v-bind="args" variant="flat" label="Flat" />
        <upw-button v-bind="args" variant="outlined" label="Outlined" />
        <upw-button v-bind="args" variant="ghost" label="Ghost" />
        <upw-button v-bind="args" variant="link" label="Link" />
      </section>
    `,
  }),
};

export const SlotAndSizes: Story = {
  parameters: {
    controls: {
      exclude: [
        "label",
        "size",
        "block",
        "iconOnly",
        "prependAvatar",
        "prependIcon",
        "appendIcon",
        "appendAvatar",
      ],
    },
  },
  render: args => ({
    components: { UpwButton },
    setup() {
      return {
        args,
      };
    },
    template: `
      <section class="flex w-full flex-wrap items-center gap-2">
        <h1 class="w-full mt-0">Slot + Sizes</h1>
        <p class="w-full mt-0">
          Buttons with all slots activated in ALL sizes<br />
        </p>

        <div class="flex w-full flex-wrap items-center gap-2">
          <h4 class="w-full">Icon only</h4>
          <upw-button v-bind="args" icon-only prepend-icon="cog" size="badge" label="Badge" />
          <upw-button v-bind="args" icon-only prepend-icon="cog" size="xs" label="XSmall" />
          <upw-button v-bind="args" icon-only prepend-icon="cog" size="sm" label="Small" />
          <upw-button v-bind="args" icon-only prepend-icon="cog" size="md" label="Medium" />
          <upw-button v-bind="args" icon-only prepend-icon="cog" size="lg" label="Large" />
        </div>

        <div class="flex w-full flex-wrap items-center gap-2">
          <h4 class="w-full">Label Only</h4>

          <upw-button v-bind="args" size="badge" label="Badge" />
          <upw-button v-bind="args" size="xs" label="XSmall" />

          <upw-button v-bind="args" size="sm" label="Small" />
          <upw-button v-bind="args" size="md" label="Medium" />
          <upw-button v-bind="args" size="lg" label="Large" />
        </div>

        <div class="flex w-full flex-wrap items-center gap-2">
          <h4 class="w-full">Label with Avatar (prepended)</h4>

          <upw-button
            v-bind="args"
            size="sm"
            label="Small"
            :prepend-avatar="{ name: 'ZA', path: 'flags' }"
          />
          <upw-button
            v-bind="args"
            size="md" label="Medium"
            :prepend-avatar="{ name: 'ZA', path: 'flags' }"
          />
          <upw-button
            v-bind="args"
            size="lg"
            label="Large"
            :prepend-avatar="{ name: 'ZA', path: 'flags' }"
          />
        </div>

        <div class="flex w-full flex-wrap items-center gap-2">
          <h4 class="w-full">Label with Icon (prepended)</h4>

          <upw-button v-bind="args" size="sm" label="Small" prepend-icon="cog" />
          <upw-button v-bind="args" size="md" label="Medium" prepend-icon="cog" />
          <upw-button v-bind="args" size="lg" label="Large" prepend-icon="cog" />
        </div>

        <div class="flex w-full flex-wrap items-center gap-2">
          <h4 class="w-full">Label with Icon (appended)</h4>

          <upw-button v-bind="args" size="sm" label="Small" append-icon="devices" />
          <upw-button v-bind="args" size="md" label="Medium" append-icon="devices" />
          <upw-button v-bind="args" size="lg" label="Large" append-icon="devices" />
        </div>

        <div class="flex w-full flex-wrap items-center gap-2">
          <h4 class="w-full">Label with Avatar (appended)</h4>

          <upw-button
            v-bind="args"
            size="sm"
            label="Small"
            :append-avatar="{ name: 'GB', path: 'flags' }"
          />
          <upw-button
            v-bind="args"
            size="md"
            label="Medium"
            :append-avatar="{ name: 'GB', path: 'flags' }"
          />
          <upw-button
            v-bind="args"
            size="lg"
            label="Large"
            :append-avatar="{ name: 'GB', path: 'flags' }"
          />
        </div>

        <div class="flex w-full flex-wrap items-center gap-2">
          <h4 class="w-full">Everything</h4>

          <upw-button
            v-bind="args"
            size="sm"
            label="Small"
            :prepend-avatar="{ name: 'ZA', path: 'flags' }"
            prepend-icon="cog"
            append-icon="devices"
            :append-avatar="{ name: 'GB', path: 'flags' }"
          />
          <upw-button
            v-bind="args"
            size="md"
            label="Medium"
            :prepend-avatar="{ name: 'ZA', path: 'flags' }"
            prepend-icon="cog"
            append-icon="devices"
            :append-avatar="{ name: 'GB', path: 'flags' }"
          />
          <upw-button
            v-bind="args"
            size="lg"
            label="Large"
            :prepend-avatar="{ name: 'ZA', path: 'flags' }"
            prepend-icon="cog"
            append-icon="devices"
            :append-avatar="{ name: 'GB', path: 'flags' }"
          />
        </div>

        <div class="flex w-full flex-wrap items-center gap-2">
          <h4 class="w-full">Everything (block)</h4>

          <upw-button
            v-bind="args"
            block
            size="sm"
            label="Small"
            :prepend-avatar="{ name: 'ZA', path: 'flags' }"
            prepend-icon="cog"
            append-icon="devices"
            :append-avatar="{ name: 'GB', path: 'flags' }"
          />
          <upw-button
            v-bind="args"
            block
            size="md"
            label="Medium"
            :prepend-avatar="{ name: 'ZA', path: 'flags' }"
            prepend-icon="cog"
            append-icon="devices"
            :append-avatar="{ name: 'GB', path: 'flags' }"
          />
          <upw-button
            v-bind="args"
            block
            size="lg"
            label="Large"
            :prepend-avatar="{ name: 'ZA', path: 'flags' }"
            prepend-icon="cog"
            append-icon="devices"
            :append-avatar="{ name: 'GB', path: 'flags' }"
          />
        </div>
      </section>
    `,
  }),
};

export const SolidColorVariants: Story = {
  parameters: {
    controls: { exclude: ["label", "variant", "color"] },
  },
  render: args => ({
    components: { UpwButton },
    setup() {
      return {
        args,
      };
    },
    template: `
      <section class="flex w-full flex-wrap items-center gap-2">
        <h1 class="w-full mt-0">Solid Color Variants</h1>
        <upw-button v-bind="args" variant="flat" color="primary" label="Primary" />
        <upw-button v-bind="args" variant="flat" color="secondary" label="Secondary" />
        <upw-button v-bind="args" variant="flat" color="accent" label="Accent" />
        <upw-button v-bind="args" variant="flat" color="base" label="Base" />
        <upw-button v-bind="args" variant="flat" color="info" label="Info" />
        <upw-button v-bind="args" variant="flat" color="success" label="Success" />
        <upw-button v-bind="args" variant="flat" color="error" label="Error" />
        <upw-button v-bind="args" variant="flat" color="warning" label="Warning" />
      </section>
    `,
  }),
};

export const OutlinedColorVariants: Story = {
  parameters: {
    controls: { exclude: ["label", "variant", "color"] },
  },
  render: args => ({
    components: { UpwButton },
    setup() {
      return {
        args,
      };
    },
    template: `
      <section class="flex w-full flex-wrap items-center gap-2">
        <h1 class="w-full mt-0">Outlined Color Variants</h1>
        <upw-button v-bind="args" variant="outlined" color="primary" label="Primary" />
        <upw-button v-bind="args" variant="outlined" color="secondary" label="Secondary" />
        <upw-button v-bind="args" variant="outlined" color="accent" label="Accent" />
        <upw-button v-bind="args" variant="outlined" color="base" label="Base" />
        <upw-button v-bind="args" variant="outlined" color="info" label="Info" />
        <upw-button v-bind="args" variant="outlined" color="success" label="Success" />
        <upw-button v-bind="args" variant="outlined" color="error" label="Error" />
        <upw-button v-bind="args" variant="outlined" color="warning" label="Warning" />
      </section>
    `,
  }),
};

export const GhostColorVariants: Story = {
  parameters: {
    controls: { exclude: ["label", "variant", "color"] },
  },
  render: args => ({
    components: { UpwButton },
    setup() {
      return {
        args,
      };
    },
    template: `
      <section class="flex w-full flex-wrap items-center gap-2">
        <h1 class="w-full mt-0">Ghost Color Variants</h1>
        <upw-button v-bind="args" variant="ghost" color="primary" label="Primary" />
        <upw-button v-bind="args" variant="ghost" color="secondary" label="Secondary" />
        <upw-button v-bind="args" variant="ghost" color="accent" label="Accent" />
        <upw-button v-bind="args" variant="ghost" color="base" label="Base" />
        <upw-button v-bind="args" variant="ghost" color="info" label="Info" />
        <upw-button v-bind="args" variant="ghost" color="success" label="Success" />
        <upw-button v-bind="args" variant="ghost" color="error" label="Error" />
        <upw-button v-bind="args" variant="ghost" color="warning" label="Warning" />
      </section>
    `,
  }),
};

export const LinkColorVariants: Story = {
  parameters: {
    controls: { exclude: ["label", "variant", "color"] },
  },
  render: args => ({
    components: { UpwButton },
    setup() {
      return {
        args,
      };
    },
    template: `
      <section class="flex w-full flex-wrap items-center gap-2">
        <h1 class="w-full mt-0">Link Color Variants</h1>
        <upw-button v-bind="args" variant="link" color="primary" label="Primary" />
        <upw-button v-bind="args" variant="link" color="secondary" label="Secondary" />
        <upw-button v-bind="args" variant="link" color="accent" label="Accent" />
        <upw-button v-bind="args" variant="link" color="base" label="Base" />
        <upw-button v-bind="args" variant="link" color="info" label="Info" />
        <upw-button v-bind="args" variant="link" color="success" label="Success" />
        <upw-button v-bind="args" variant="link" color="error" label="Error" />
        <upw-button v-bind="args" variant="link" color="warning" label="Warning" />
      </section>
    `,
  }),
};

export const LoadingColorVariants: Story = {
  parameters: {
    controls: { exclude: ["label", "color"] },
  },
  render: args => ({
    components: { UpwButton },
    setup() {
      return { args };
    },
    template: `
      <section class="flex w-full flex-wrap items-center gap-2">
        <h1 class="w-full mt-0">Loading Color Variants</h1>
        <upw-button v-bind="args" color="primary" label="Primary" />
        <upw-button v-bind="args" color="secondary" label="Secondary" />
        <upw-button v-bind="args" color="accent" label="Accent" />
        <upw-button v-bind="args" color="base" label="Base" />
        <upw-button v-bind="args" color="info" label="Info" />
        <upw-button v-bind="args" color="success" label="Success" />
        <upw-button v-bind="args" color="error" label="Error" />
        <upw-button v-bind="args" color="warning" label="Warning" />
      </section>
    `,
  }),
  args: {
    loading: true,
  },
};

export const DisabledColorVariants: Story = {
  parameters: {
    controls: { exclude: ["label", "color"] },
  },
  render: args => ({
    components: { UpwButton },
    setup() {
      return { args };
    },
    template: `
      <section class="flex w-full flex-wrap items-center gap-2">
        <h1 class="w-full mt-0">Disabled Color Variants</h1>
        <upw-button v-bind="args" color="primary" label="Primary" />
        <upw-button v-bind="args" color="secondary" label="Secondary" />
        <upw-button v-bind="args" color="accent" label="Accent" />
        <upw-button v-bind="args" color="base" label="Base" />
        <upw-button v-bind="args" color="info" label="Info" />
        <upw-button v-bind="args" color="success" label="Success" />
        <upw-button v-bind="args" color="error" label="Error" />
        <upw-button v-bind="args" color="warning" label="Warning" />
      </section>
    `,
  }),
  args: {
    disabled: true,
  },
};
