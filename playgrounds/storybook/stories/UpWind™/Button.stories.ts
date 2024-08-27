// --- external
import type { Meta, StoryObj } from "@storybook/vue3";
import { ref } from "vue";

// -- components
import { UwAvatar, UwButton, useCustomElement } from "@upmind/upwind";
useCustomElement(UwButton);
useCustomElement(UwAvatar);

// --- utils
import { useSystemArgTypes } from "../../utils";
import { keys, isFunction } from "lodash-es";

// --- types
enum variants {
  flat = "Flat",
  outline = "Outline",
  ghost = "Ghost",
  link = "Link",
  tonal = "Tonal",
}
// -----------------------------------------------------------------------------

const meta: Meta<typeof UwButton> = {
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
    // prependAvatar: {
    //   ...useSystemArgTypes.flag,
    //   if: { arg: "iconOnly", truthy: false },
    // },
    // prependIcon: useSystemArgTypes.icon,
    // appendIcon: {
    //   ...useSystemArgTypes.icon,
    //   if: { arg: "iconOnly", truthy: false },
    // },
    // appendAvatar: {
    //   ...useSystemArgTypes.flag,
    //   if: { arg: "iconOnly", truthy: false },
    // },

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
    // loading: false,
    disabled: false,
  },
  render: args => ({
    setup() {
      return { args };
    },
    template: `<uw-button v-bind="args"/>`,
  }),
};

export default meta;
type Story = StoryObj<typeof UwButton>;

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
        <uw-button v-bind="args" variant="flat" label="Flat" />
        <uw-button v-bind="args" variant="outline" label="Outline" />
        <uw-button v-bind="args" variant="ghost" label="Ghost" />
        <uw-button v-bind="args" variant="link" label="Link" />
      </section>
    `,
  }),
};

export const Slots: Story = {
  parameters: {
    controls: {
      exclude: ["label", "block"],
    },
  },
  render: args => ({
    setup() {
      const avatar = useSystemArgTypes.flag.options.find(flag =>
        flag.includes("gb")
      );
      const icon = ref();
      const iconSvg = useSystemArgTypes.icon.options[16];
      if (isFunction(iconSvg))
        iconSvg().then(value => {
          debugger;
          icon.value = value;
        });

      return {
        args,
        avatar,
        icon,
      };
    },
    template: `
     <section class="flex w-full flex-wrap items-center gap-2">
      <h1 class="w-full mt-0">Slots</h1>
      <p class="w-full mt-0">Buttons with all slots activated in ALL sizes<br /></p>

      <uw-button
        v-bind="args"
        label="Label Only" />

      <uw-button
        v-bind="args"
        icon-only
        label="Icon Only">
        <uw-avatar
          slot="prepend"
          class="w-full h-full"
          :avatar="{src: avatar, caption: 'GB' }"></uw-avatar>
      </uw-button>

     <uw-button
        v-bind="args"
        label="Prepend Avatar">
        <uw-avatar
          slot="prepend"
          class="w-full h-full"
          :avatar="{src: avatar, caption: 'GB' }"></uw-avatar>
      </uw-button>

      <uw-button
        v-bind="args"
        label="Prepend icon">
        <span slot="prepend"></span>
      </uw-button>

      <uw-button
        v-bind="args"
        label="Append icon"
        ><span
          v-html="icon"
          slot="append"
      /></uw-button>

      <uw-button
        v-bind="args"
        label="Append Avatar"
        >
        <uw-avatar
          slot="append"
          class="w-full h-full"
          :avatar="{src: avatar, caption: 'GB' }" />
        </uw-button>
    </section>

    `,
  }),
};

export const SolidColorVariants: Story = {
  parameters: {
    controls: { exclude: ["label", "variant", "color"] },
  },
  render: args => ({
    setup() {
      return {
        args,
      };
    },
    template: `
      <section class="flex w-full flex-wrap items-center gap-2">
        <h1 class="w-full mt-0">Solid Color Variants</h1>
        <uw-button v-bind="args" variant="flat" color="base" label="Base" />
        <uw-button v-bind="args" variant="flat" color="primary" label="Primary" />
        <uw-button v-bind="args" variant="flat" color="secondary" label="Secondary" />
        <uw-button v-bind="args" variant="flat" color="accent" label="Accent" />
        <uw-button v-bind="args" variant="flat" color="promotion" label="Promotion" />
        <uw-button v-bind="args" variant="flat" color="destructive" label="Destructive" />
        <uw-button v-bind="args" variant="flat" color="success" label="Success" />
        <uw-button v-bind="args" variant="flat" color="info" label="Info" />
        <uw-button v-bind="args" variant="flat" color="error" label="Error" />
        <uw-button v-bind="args" variant="flat" color="warning" label="Warning" />
      </section>
    `,
  }),
};

export const outlineColorVariants: Story = {
  parameters: {
    controls: { exclude: ["label", "variant", "color"] },
  },
  render: args => ({
    setup() {
      return {
        args,
      };
    },
    template: `
      <section class="flex w-full flex-wrap items-center gap-2">
        <h1 class="w-full mt-0">outline Color Variants</h1>
        <uw-button v-bind="args" variant="outline" color="base" label="Base" />
        <uw-button v-bind="args" variant="outline" color="primary" label="Primary" />
        <uw-button v-bind="args" variant="outline" color="secondary" label="Secondary" />
        <uw-button v-bind="args" variant="outline" color="accent" label="Accent" />
         <uw-button v-bind="args" variant="outline" color="promotion" label="Promotion" />
        <uw-button v-bind="args" variant="outline" color="destructive" label="Destructive" />
        <uw-button v-bind="args" variant="outline" color="success" label="Success" />
        <uw-button v-bind="args" variant="outline" color="info" label="Info" />
        <uw-button v-bind="args" variant="outline" color="error" label="Error" />
        <uw-button v-bind="args" variant="outline" color="warning" label="Warning" />
      </section>
    `,
  }),
};

export const GhostColorVariants: Story = {
  parameters: {
    controls: { exclude: ["label", "variant", "color"] },
  },
  render: args => ({
    setup() {
      return {
        args,
      };
    },
    template: `
      <section class="flex w-full flex-wrap items-center gap-2">
        <h1 class="w-full mt-0">Ghost Color Variants</h1>
        <uw-button v-bind="args" variant="ghost" color="base" label="Base" />
        <uw-button v-bind="args" variant="ghost" color="primary" label="Primary" />
        <uw-button v-bind="args" variant="ghost" color="secondary" label="Secondary" />
        <uw-button v-bind="args" variant="ghost" color="accent" label="Accent" />
        <uw-button v-bind="args" variant="ghost" color="promotion" label="Promotion" />
        <uw-button v-bind="args" variant="ghost" color="destructive" label="Destructive" />
        <uw-button v-bind="args" variant="ghost" color="success" label="Success" />
        <uw-button v-bind="args" variant="ghost" color="info" label="Info" />
        <uw-button v-bind="args" variant="ghost" color="error" label="Error" />
        <uw-button v-bind="args" variant="ghost" color="warning" label="Warning" />
      </section>
    `,
  }),
};

export const LinkColorVariants: Story = {
  parameters: {
    controls: { exclude: ["label", "variant", "color"] },
  },
  render: args => ({
    setup() {
      return {
        args,
      };
    },
    template: `
      <section class="flex w-full flex-wrap items-center gap-2">
        <h1 class="w-full mt-0">Link Color Variants</h1>
        <uw-button v-bind="args" variant="link" color="base" label="Base" />
        <uw-button v-bind="args" variant="link" color="primary" label="Primary" />
        <uw-button v-bind="args" variant="link" color="secondary" label="Secondary" />
        <uw-button v-bind="args" variant="link" color="accent" label="Accent" />
        <uw-button v-bind="args" variant="link" color="promotion" label="Promotion" />
        <uw-button v-bind="args" variant="link" color="destructive" label="Destructive" />
        <uw-button v-bind="args" variant="link" color="success" label="Success" />
        <uw-button v-bind="args" variant="link" color="info" label="Info" />
        <uw-button v-bind="args" variant="link" color="error" label="Error" />
        <uw-button v-bind="args" variant="link" color="warning" label="Warning" />
      </section>
    `,
  }),
};

export const TonalColorVariants: Story = {
  parameters: {
    controls: { exclude: ["label", "variant", "color"] },
  },
  render: args => ({
    setup() {
      return {
        args,
      };
    },
    template: `
      <section class="flex w-full flex-wrap items-center gap-2">
        <h1 class="w-full mt-0">Tonal Color Variants</h1>
        <uw-button v-bind="args" variant="tonal" color="base" label="Base" />
        <uw-button v-bind="args" variant="tonal" color="primary" label="Primary" />
        <uw-button v-bind="args" variant="tonal" color="secondary" label="Secondary" />
        <uw-button v-bind="args" variant="tonal" color="accent" label="Accent" />
        <uw-button v-bind="args" variant="tonal" color="promotion" label="Promotion" />
        <uw-button v-bind="args" variant="tonal" color="destructive" label="Destructive" />
        <uw-button v-bind="args" variant="tonal" color="success" label="Success" />
        <uw-button v-bind="args" variant="tonal" color="info" label="Info" />
        <uw-button v-bind="args" variant="tonal" color="error" label="Error" />
        <uw-button v-bind="args" variant="tonal" color="warning" label="Warning" />
      </section>
    `,
  }),
};

// export const LoadingColorVariants: Story = {
//   parameters: {
//     controls: { exclude: ["label", "color"] },
//   },
//   render: args => ({
//     components: {  },
//     setup() {
//       return { args };
//     },
//     template: `
//     <section class="flex w-full flex-wrap items-center gap-2">
//     <h1 class="w-full mt-0">Loading Color Variants</h1>
//         <uw-button v-bind="args" color="base" label="Base" />
//         <uw-button v-bind="args" color="primary" label="Primary" />
//         <uw-button v-bind="args" color="secondary" label="Secondary" />
//         <uw-button v-bind="args" color="accent" label="Accent" />
//         <uw-button v-bind="args" color="promotion" label="Promotion" />
//         <uw-button v-bind="args" color="destructive" label="Destructive" />
//         <uw-button v-bind="args" color="success" label="Success" />
//         <uw-button v-bind="args" color="info" label="Info" />
//         <uw-button v-bind="args" color="error" label="Error" />
//         <uw-button v-bind="args" color="warning" label="Warning" />
//       </section>
//     `,
//   }),
//   args: {
//     loading: true,
//   },
// };

export const DisabledColorVariants: Story = {
  parameters: {
    controls: { exclude: ["label", "color"] },
  },
  render: args => ({
    setup() {
      return { args };
    },
    template: `
      <section class="flex w-full flex-wrap items-center gap-2">
        <h1 class="w-full mt-0">Disabled Color Variants</h1>
        <uw-button v-bind="args" color="base" label="Base" />
        <uw-button v-bind="args" color="primary" label="Primary" />
        <uw-button v-bind="args" color="secondary" label="Secondary" />
        <uw-button v-bind="args" color="accent" label="Accent" />
        <uw-button v-bind="args" color="promotion" label="Promotion" />
        <uw-button v-bind="args" color="destructive" label="Destructive" />
        <uw-button v-bind="args" color="success" label="Success" />
        <uw-button v-bind="args" color="info" label="Info" />
        <uw-button v-bind="args" color="error" label="Error" />
        <uw-button v-bind="args" color="warning" label="Warning" />
      </section>
    `,
  }),
  args: {
    disabled: true,
  },
};
