// --- external
import { ref } from "vue";
import type { Meta, StoryObj } from "@storybook/vue3";

// -- components
import { UwAvatar, useCustomElement } from "@upmind/upwind";
useCustomElement(UwAvatar);

// --- utils
import { useSystemArgTypes } from "../../utils";
import { keys, isFunction, find, findIndex } from "lodash-es";

// -----------------------------------------------------------------------------
enum shapes {
  circle = "Circle",
  square = "Square",
}

const meta: Meta<typeof UwAvatar> = {
  argTypes: {
    avatar: useSystemArgTypes.flag,
    size: useSystemArgTypes.baseSizes,
    shape: {
      options: keys(shapes),
      control: {
        type: "radio",
        labels: shapes,
      },
    },
  },
  args: {
    avatar: "",
    caption: "DC",
    size: "md",
    shape: "circle",
  },
  render: args => ({
    setup() {
      return { args };
    },
    template: `<uw-avatar v-bind="args" :avatar="{src: args.avatar, caption:args.caption }"/>`,
  }),
};

export default meta;
type Story = StoryObj<typeof UwAvatar>;

export const Base: Story = {};

export const Flag: Story = {
  args: {
    avatar: useSystemArgTypes.flag.options.find((flag, key) =>
      flag.includes("gb")
    ),
    caption: "GB",
    size: "md",
  },
};

export const Gravatar: Story = {
  args: {
    avatar:
      "https://www.gravatar.com/avatar/4289a4e6163b9adc987168444774435b?d=404&s=200",
    size: "md",
  },
};

export const SlotContent: Story = {
  parameters: {
    controls: { exclude: ["avatar"] },
  },
  args: {
    size: "md",
  },
  render: args => ({
    setup() {
      const svg = ref();
      const avatar = useSystemArgTypes.icon.options[16];
      if (isFunction(avatar)) avatar().then(value => (svg.value = value));
      return {
        args,
        svg,
      };
    },
    template: `
        <uw-avatar v-bind="args" :avatar="null" v-html="svg" />
    `,
  }),
};

export const GravatarWithText: Story = {
  args: {
    caption: "DC",
    avatar:
      "https://www.gravatar.com/avatar/98302662b1abcc4cfe17b1205cb53255?d=blank&s=200",
    size: "md",
  },
};
