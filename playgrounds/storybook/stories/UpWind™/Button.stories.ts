// --- global
import type { Meta, StoryObj } from "@storybook/vue3";

// -- components
import { UpwButton } from "@upmind/upwind";

// --- utils
import { useSystemArgTypes } from "../../utils";
import { keys } from "lodash-es";

// -----------------------------------------------------------------------------

enum variants {
  flat = "Flat",
  outlined = "Outlined",
  ghost = "Ghost",
  link = "Link",
}

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
    prependAvatar: useSystemArgTypes.flag,
    appendAvatar: useSystemArgTypes.flag,
    prependIcon: useSystemArgTypes.icon,
    appendIcon: useSystemArgTypes.icon,
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
      f;
    },
    template: `
      <section class="flex w-full flex-wrap items-center gap-2">
        <h1 class="w-full mt-0">Types/Variants</h1>
        <upw-button v-bind="args" variant="flat" label="Flat (Solid)" />
        <upw-button v-bind="args" variant="outlined" label="Outlined" />
        <upw-button v-bind="args" variant="ghost" label="Ghost" />
        <upw-button v-bind="args" variant="link" label="Link" />
      </section>
    `,
  }),
};

export const SlotAndSizes: Story = {
  render: () => ({
    components: { UpwButton },
    template: `
      <section class="flex w-full flex-wrap items-center gap-2">
        <h1 class="w-full mt-0">Slot + Sizes</h1>
        <p class="w-full mt-0">
          Buttons with all slots activated in ALL sizes<br />
        </p>

        <div class="flex w-full flex-wrap items-center gap-2">
          <h4 class="w-full">Icon only</h4>
          <upw-button icon-only prepend-icon="cog" size="sm" label="Small" />
          <upw-button icon-only prepend-icon="cog" label="Medium" />
          <upw-button icon-only prepend-icon="cog" size="lg" label="Large" />
        </div>

        <div class="flex w-full flex-wrap items-center gap-2">
          <h4 class="w-full">Label Only</h4>

          <upw-button size="sm" label="Small" />
          <upw-button label="Medium" />
          <upw-button size="lg" label="Large" />
        </div>

        <div class="flex w-full flex-wrap items-center gap-2">
          <h4 class="w-full">Label with Avatar (prepended)</h4>

          <upw-button
            size="sm"
            label="Small"
            :prepend-avatar="{ name: 'ZA', path: 'flags' }"
          />
          <upw-button
            label="Medium"
            :prepend-avatar="{ name: 'ZA', path: 'flags' }"
          />
          <upw-button
            size="lg"
            label="Large"
            :prepend-avatar="{ name: 'ZA', path: 'flags' }"
          />
        </div>

        <div class="flex w-full flex-wrap items-center gap-2">
          <h4 class="w-full">Label with Icon (prepended)</h4>

          <upw-button size="sm" label="Small" prepend-icon="cog" />
          <upw-button label="Medium" prepend-icon="cog" />
          <upw-button size="lg" label="Large" prepend-icon="cog" />
        </div>

        <div class="flex w-full flex-wrap items-center gap-2">
          <h4 class="w-full">Label with Icon (appended)</h4>

          <upw-button size="sm" label="Small" append-icon="devices" />
          <upw-button label="Medium" append-icon="devices" />
          <upw-button size="lg" label="Large" append-icon="devices" />
        </div>

        <div class="flex w-full flex-wrap items-center gap-2">
          <h4 class="w-full">Label with Avatar (appended)</h4>

          <upw-button
            size="sm"
            label="Small"
            :append-avatar="{ name: 'GB', path: 'flags' }"
          />
          <upw-button
            label="Medium"
            :append-avatar="{ name: 'GB', path: 'flags' }"
          />
          <upw-button
            size="lg"
            label="Large"
            :append-avatar="{ name: 'GB', path: 'flags' }"
          />
        </div>

        <div class="flex w-full flex-wrap items-center gap-2">
          <h4 class="w-full">Everything</h4>

          <upw-button
            size="sm"
            label="Small"
            :prepend-avatar="{ name: 'ZA', path: 'flags' }"
            prepend-icon="cog"
            append-icon="devices"
            :append-avatar="{ name: 'GB', path: 'flags' }"
          />
          <upw-button
            label="Medium"
            :prepend-avatar="{ name: 'ZA', path: 'flags' }"
            prepend-icon="cog"
            append-icon="devices"
            :append-avatar="{ name: 'GB', path: 'flags' }"
          />
          <upw-button
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
            block
            size="sm"
            label="Small"
            :prepend-avatar="{ name: 'ZA', path: 'flags' }"
            prepend-icon="cog"
            append-icon="devices"
            :append-avatar="{ name: 'GB', path: 'flags' }"
          />
          <upw-button
            block
            label="Medium"
            :prepend-avatar="{ name: 'ZA', path: 'flags' }"
            prepend-icon="cog"
            append-icon="devices"
            :append-avatar="{ name: 'GB', path: 'flags' }"
          />
          <upw-button
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
  render: () => ({
    components: { UpwButton },
    template: `
      <section class="flex w-full flex-wrap items-center gap-2">
        <h1 class="w-full mt-0">Solid Color Variants</h1>
        <upw-button color="primary" label="Primary" />
        <upw-button color="secondary" label="Secondary" />
        <upw-button color="accent" label="Accent" />
        <upw-button color="neutral" label="Neutral" />
        <upw-button color="info" label="Info" />
        <upw-button color="success" label="Success" />
        <upw-button color="error" label="Error" />
        <upw-button color="warning" label="Warning" />
      </section>
    `,
  }),
};

export const OutlinedColorVariants: Story = {
  render: () => ({
    components: { UpwButton },
    template: `
      <section class="flex w-full flex-wrap items-center gap-2">
        <h1 class="w-full mt-0">Outlined Color Variants</h1>
        <upw-button variant="outlined" color="primary" label="Primary" />
        <upw-button variant="outlined" color="secondary" label="Secondary" />
        <upw-button variant="outlined" color="accent" label="Accent" />
        <upw-button variant="outlined" color="neutral" label="Neutral" />
        <upw-button variant="outlined" color="info" label="Info" />
        <upw-button variant="outlined" color="success" label="Success" />
        <upw-button variant="outlined" color="error" label="Error" />
        <upw-button variant="outlined" color="warning" label="Warning" />
      </section>
    `,
  }),
};

export const GhostColorVariants: Story = {
  render: () => ({
    components: { UpwButton },
    template: `
      <section class="flex w-full flex-wrap items-center gap-2">
        <h1 class="w-full mt-0">Ghost Color Variants</h1>
        <upw-button variant="ghost" color="primary" label="Primary" />
        <upw-button variant="ghost" color="secondary" label="Secondary" />
        <upw-button variant="ghost" color="accent" label="Accent" />
        <upw-button variant="ghost" color="neutral" label="Neutral" />
        <upw-button variant="ghost" color="info" label="Info" />
        <upw-button variant="ghost" color="success" label="Success" />
        <upw-button variant="ghost" color="error" label="Error" />
        <upw-button variant="ghost" color="warning" label="Warning" />
      </section>
    `,
  }),
};

export const LinkColorVariants: Story = {
  render: () => ({
    components: { UpwButton },
    template: `
      <section class="flex w-full flex-wrap items-center gap-2">
        <h1 class="w-full mt-0">Link Color Variants</h1>
        <upw-button variant="link" color="primary" label="Primary" />
        <upw-button variant="link" color="secondary" label="Secondary" />
        <upw-button variant="link" color="accent" label="Accent" />
        <upw-button variant="link" color="neutral" label="Neutral" />
        <upw-button variant="link" color="info" label="Info" />
        <upw-button variant="link" color="success" label="Success" />
        <upw-button variant="link" color="error" label="Error" />
        <upw-button variant="link" color="warning" label="Warning" />
      </section>
    `,
  }),
};

export const LoadingColorVariants: Story = {
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
        <upw-button v-bind="args" color="neutral" label="Neutral" />
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
        <upw-button v-bind="args" color="neutral" label="Neutral" />
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
